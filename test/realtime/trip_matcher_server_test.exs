defmodule Realtime.TripMatcherServerTest do
  use Orbit.DataCase

  alias Orbit.Vehicle
  alias Realtime.PollingServer
  alias Realtime.TripMatcherServer
  import Mock
  import Orbit.Factory
  import Test.Support.Helpers

  setup do
    {:ok, _} =
      start_supervised(
        {PollingServer,
         %PollingServer.Opts{
           server_name: :vehicle_positions,
           entity_type: :vehicle_positions,
           s3_ref: :rtr_public,
           s3_path: "VehiclePositions_enhanced.json",
           poll_delay: 10_000,
           decode_fn: fn
             "" ->
               nil

             timestamp ->
               %{
                 timestamp: String.to_integer(timestamp),
                 entities: [
                   build(:vehicle_position)
                 ]
               }
           end
         }},
        id: :vehicle_positions
      )

    {:ok, _} =
      start_supervised(
        {PollingServer,
         %PollingServer.Opts{
           server_name: :trip_updates,
           entity_type: :trip_updates,
           s3_ref: :rtr_public,
           s3_path: "TripUpdates_enhanced.json",
           poll_delay: 10_000,
           decode_fn: fn
             "" ->
               nil

             timestamp ->
               %{
                 timestamp: String.to_integer(timestamp),
                 entities: [
                   build(:trip_updates)
                 ]
               }
           end
         }},
        id: :trip_updates
      )

    :ok
  end

  test_with_mocks "retries EntitiesServer if it fails to connect the first time", [
    {Orbit.Ocs.EntitiesServer, [:passthrough], []}
  ] do
    reassign_env(:orbit, :subscribe_to_ocs?, true)
    {:ok, _} = start_supervised(Realtime.TripMatcherServer)
    Process.sleep(4000)
    assert_called_at_least(Orbit.Ocs.EntitiesServer.subscribe(:_), 2)
  end

  test "subscribed client gets latest data on subscribing" do
    {:ok, _} = start_supervised(Realtime.TripMatcherServer)

    send(
      Realtime.TripMatcherServer,
      {:new_data, :vehicle_positions, %{timestamp: 4, entities: [build(:vehicle_position)]}}
    )

    assert %{timestamp: 4, entities: [%Vehicle{position: %{vehicle_id: "R-547210A7"}}]} =
             TripMatcherServer.subscribe(self())
  end

  test "subscribed client gets latest data on incoming VehiclePosition" do
    {:ok, _} = start_supervised(Realtime.TripMatcherServer)

    send(
      Realtime.TripMatcherServer,
      {:new_data, :vehicle_positions, %{timestamp: 4, entities: [build(:vehicle_position)]}}
    )

    TripMatcherServer.subscribe(self())

    send(
      Realtime.TripMatcherServer,
      {:new_data, :vehicle_positions, %{timestamp: 4, entities: [build(:vehicle_position)]}}
    )

    assert_receive {:new_data, :vehicles, %{timestamp: _, entities: [%Vehicle{}]}}
  end

  test "ensure_push triggers a send if too much time has passed" do
    {:ok, _} = start_supervised(Realtime.TripMatcherServer)
    TripMatcherServer.subscribe(self())

    refute_receive {:new_data, :vehicles, []}

    # In real life this isn't 0, but we want to test that it works immediately
    send(Realtime.TripMatcherServer, {:ensure_push, 0})

    assert_receive {:new_data, :vehicles, %{timestamp: _, entities: []}}
  end

  test "does not log missing OCS data before first tick of OCS data" do
    {:ok, _} = start_supervised(Realtime.TripMatcherServer)
    TripMatcherServer.subscribe(self())

    vehicle = build(:vehicle_position, vehicle_id: "R-12345678")

    logs =
      capture_log do
        send(
          Realtime.TripMatcherServer,
          {:new_data, :vehicle_positions, %{timestamp: 4, entities: [vehicle]}}
        )

        Process.sleep(50)
      end

    # Should not log trip matcher statistics if we haven't got OCS data yet
    assert not Enum.any?(logs, &match?("[info] trip_matcher_statistics" <> _, &1))

    logs =
      capture_log do
        send(
          Realtime.TripMatcherServer,
          {:new_data, :ocs_trips, %{timestamp: 5, entities: [build(:ocs_trip)]}}
        )

        Process.sleep(50)
      end

    statistics_log = Enum.find(logs, &match?("[info] trip_matcher_statistics" <> _, &1))

    # Should log missing fields for vehicle ID
    assert ~s([info] trip_matcher_statistics total=1 missing_current_actual_departure_time="R-12345678" missing_current_arrival_station="R-12345678" missing_current_departure_station="R-12345678" missing_current_estimated_arrival_time="R-12345678" missing_current_scheduled_arrival_time="R-12345678" missing_current_scheduled_departure_time="R-12345678" missing_next_arrival_station="R-12345678" missing_next_departure_station="R-12345678" missing_next_scheduled_arrival_time="R-12345678" missing_next_scheduled_departure_time="R-12345678") ==
             statistics_log
  end
end
