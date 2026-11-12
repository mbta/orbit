defmodule Orbit.Ocs.EntitiesServerTest do
  use Orbit.DataCase

  alias Orbit.Ocs.EntitiesServer
  alias Orbit.Ocs.Trip
  alias Orbit.Repo

  import Mock
  import Orbit.Factory

  @mock_start_time DateTime.from_iso8601("2025-07-07T12:00:00.000-04:00") |> elem(1)
  @mock_start_time_plus_3 DateTime.from_iso8601("2025-07-07T12:00:03.000-04:00") |> elem(1)
  @mock_start_time_plus_5 DateTime.from_iso8601("2025-07-07T12:00:05.000-04:00") |> elem(1)

  @yesterday ~D[2025-07-07]
  @today ~D[2025-07-08]
  # Service date @today
  @today_after_3am DateTime.from_iso8601("2025-07-08T03:00:05.000-04:00") |> elem(1)

  setup_with_mocks([
    {DateTime, [:passthrough],
     [
       utc_now: fn -> @mock_start_time end
     ]}
  ]) do
    # Seed initial trips
    build(:trip)
    |> Trip.changeset()
    |> Repo.insert!()

    {:ok, _} = start_supervised({EntitiesServer, [schedule_pushes?: false]})
    :ok
  end

  test "subscribed client gets server PID on subscribing" do
    assert is_pid(EntitiesServer.subscribe(self()))
  end

  test "changes are not pushed until throttle time" do
    EntitiesServer.subscribe(self())

    with_mocks([
      {DateTime, [:passthrough],
       [
         utc_now: fn -> @mock_start_time_plus_3 end
       ]}
    ]) do
      message = build(:tsch_new, trip_uid: "22222")
      EntitiesServer.new_messages([message])

      refute_receive {:new_data, :ocs_trips, _}
    end

    with_mocks([
      {DateTime, [:passthrough],
       [
         utc_now: fn -> @mock_start_time_plus_5 end
       ]}
    ]) do
      message = build(:tsch_new, trip_uid: "33333")
      EntitiesServer.new_messages([message])

      assert_receive {:new_data, :ocs_trips, %{entities: trips, timestamp: _}}

      assert Enum.any?(trips, fn trip -> trip.uid == "11111" end)
      assert Enum.any?(trips, fn trip -> trip.uid == "22222" end)
      assert Enum.any?(trips, fn trip -> trip.uid == "33333" end)
    end
  end

  test "ensure_push triggers a send if too much time has passed" do
    pid = EntitiesServer.subscribe(self())

    message = build(:tsch_new, trip_uid: "22222")
    EntitiesServer.new_messages(pid, [message])

    refute_receive {:new_data, :ocs_trips, _}

    with_mocks([
      {DateTime, [:passthrough],
       [
         utc_now: fn -> @mock_start_time_plus_3 end
       ]}
    ]) do
      send(pid, :ensure_push)
      refute_receive {:new_data, :ocs_trips, _}
    end

    with_mocks([
      {DateTime, [:passthrough],
       [
         utc_now: fn -> @mock_start_time_plus_5 end
       ]}
    ]) do
      send(pid, :ensure_push)
      assert_receive {:new_data, :ocs_trips, %{entities: trips, timestamp: _}}
      assert Enum.any?(trips, fn trip -> trip.uid == "11111" end)
      assert Enum.any?(trips, fn trip -> trip.uid == "22222" end)
    end
  end

  describe "trip_uid_cache on push" do
    test "caches new trip UIDs with their row's service date, not the push's service date" do
      # e.g. a trip created at 02:59:58 whose first push happens after 3am
      insert(:trip, uid: "44444", service_date: @yesterday)
      refute Map.has_key?(trip_uid_cache(), "44444")

      assert %{"44444" => @yesterday} = push_at(@today_after_3am)
    end

    test "keeps the earliest service date when a trip UID is both cached and queried" do
      put_trip_uid_cache(%{"44444" => @yesterday, "55555" => @today})
      insert(:trip, uid: "44444", service_date: @today)
      insert(:trip, uid: "55555", service_date: @yesterday)

      assert %{"44444" => @yesterday, "55555" => @yesterday} = push_at(@today_after_3am)
    end

    test "keeps cached trip UIDs that are no longer queried, within the TTL" do
      put_trip_uid_cache(%{"44444" => @yesterday})

      assert %{"44444" => @yesterday} = push_at(@today_after_3am)
    end

    test "prunes cached trip UIDs older than the TTL" do
      oldest_kept = Date.add(@today, -Orbit.Ocs.Entities.trip_uid_ttl_d())
      expired = Date.add(oldest_kept, -1)
      put_trip_uid_cache(%{"44444" => oldest_kept, "55555" => expired})

      cache = push_at(@today_after_3am)

      assert %{"44444" => ^oldest_kept} = cache
      refute Map.has_key?(cache, "55555")
    end
  end

  # Forces a push at `datetime` (must be >= 5s after the previous push to avoid the
  # throttle) and returns the resulting trip UID cache. Both clocks are mocked:
  # DateTime.utc_now/0 drives the throttle and query_latest/0, while
  # Util.Time.current_time/0 drives the service date used for pruning.
  defp push_at(datetime) do
    with_mocks([
      {DateTime, [:passthrough], [utc_now: fn -> datetime end]},
      {Util.Time, [:passthrough], [current_time: fn -> DateTime.to_unix(datetime) end]}
    ]) do
      :ok = EntitiesServer.new_messages([])
    end

    trip_uid_cache()
  end

  defp trip_uid_cache do
    :sys.get_state({:global, EntitiesServer}).trip_uid_cache
  end

  defp put_trip_uid_cache(cache) do
    :sys.replace_state({:global, EntitiesServer}, &%{&1 | trip_uid_cache: cache})
  end
end
