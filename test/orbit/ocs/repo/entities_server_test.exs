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

  test "subscribed client gets latest data on subscribing" do
    assert %{entities: [%Trip{uid: "11111"}]} =
             EntitiesServer.subscribe(self())
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
    EntitiesServer.subscribe(self())

    message = build(:tsch_new, trip_uid: "22222")
    EntitiesServer.new_messages([message])

    refute_receive {:new_data, :ocs_trips, _}

    with_mocks([
      {DateTime, [:passthrough],
       [
         utc_now: fn -> @mock_start_time_plus_3 end
       ]}
    ]) do
      send(EntitiesServer, :ensure_push)
      refute_receive {:new_data, :ocs_trips, _}
    end

    with_mocks([
      {DateTime, [:passthrough],
       [
         utc_now: fn -> @mock_start_time_plus_5 end
       ]}
    ]) do
      send(EntitiesServer, :ensure_push)
      assert_receive {:new_data, :ocs_trips, %{entities: trips, timestamp: _}}
      assert Enum.any?(trips, fn trip -> trip.uid == "11111" end)
      assert Enum.any?(trips, fn trip -> trip.uid == "22222" end)
    end
  end
end
