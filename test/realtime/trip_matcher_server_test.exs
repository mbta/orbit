defmodule Realtime.TripMatcherServerTest do
  use ExUnit.Case

  alias Orbit.Vehicle
  alias Realtime.PollingServer
  alias Realtime.TripMatcherServer
  import Orbit.Factory

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

    {:ok, _} = start_supervised(Realtime.TripMatcherServer)

    :ok
  end

  test "subscribed client gets latest data on subscribing" do
    send(
      Realtime.TripMatcherServer,
      {:new_data, :vehicle_positions, %{timestamp: 4, entities: [build(:vehicle_position)]}}
    )

    assert %{timestamp: 4, entities: [%Vehicle{position: %{vehicle_id: "R-547210A7"}}]} =
             TripMatcherServer.subscribe(self())
  end

  test "subscribed client gets latest data on incoming VehiclePosition" do
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
    TripMatcherServer.subscribe(self())

    refute_receive {:new_data, :vehicles, []}

    # In real life this isn't 0, but we want to test that it works immediately
    send(Realtime.TripMatcherServer, {:ensure_push, 0})

    assert_receive {:new_data, :vehicles, %{timestamp: _, entities: []}}
  end
end
