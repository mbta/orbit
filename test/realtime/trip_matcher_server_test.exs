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

    # Missing trip fields are not guaranteed to log in a consistent order, so
    # need to sort and then compare.
    fields =
      Enum.find_value(logs, fn log ->
        case log do
          "[info] trip_matcher_statistics total=1 " <> fields -> fields
          _ -> false
        end
      end)
      |> String.split(" ")
      |> Enum.sort()

    assert fields == [
             ~s(large_delta_between_scheduled_actual_departures=""),
             ~s(missing_current_actual_departure_time="R-12345678"),
             ~s(missing_current_arrival_station="R-12345678"),
             ~s(missing_current_departure_station="R-12345678"),
             ~s(missing_current_estimated_arrival_time="R-12345678"),
             ~s(missing_current_scheduled_arrival_time="R-12345678"),
             ~s(missing_current_scheduled_departure_time="R-12345678"),
             ~s(missing_next_arrival_station="R-12345678"),
             ~s(missing_next_departure_station="R-12345678"),
             ~s(missing_next_scheduled_arrival_time="R-12345678"),
             ~s(missing_next_scheduled_departure_time="R-12345678")
           ]
  end

  test "populates actual departure for a vehicle that just departed, before it's in the database" do
    {:ok, _} = start_supervised(Realtime.TripMatcherServer)
    TripMatcherServer.subscribe(self())

    departed_at = DateTime.truncate(DateTime.utc_now(), :second)

    # Factory trip originates at Ashmont
    ocs_trip = build(:ocs_trip, train_uid: "5484208E", assigned_at: departed_at)

    stopped_at_origin =
      build(:vehicle_position,
        vehicle_id: "R-5484208E",
        direction: 1,
        station_id: "place-asmnl",
        current_status: :STOPPED_AT,
        timestamp: DateTime.add(departed_at, -30, :second)
      )

    departing =
      build(:vehicle_position,
        vehicle_id: "R-5484208E",
        direction: 1,
        station_id: "place-smmnl",
        current_status: :IN_TRANSIT_TO,
        timestamp: departed_at
      )

    send(
      Realtime.TripMatcherServer,
      {:new_data, :ocs_trips, %{timestamp: 1, entities: [ocs_trip]}}
    )

    send(
      Realtime.TripMatcherServer,
      {:new_data, :vehicle_positions, %{timestamp: 4, entities: [stopped_at_origin]}}
    )

    assert_receive {:new_data, :vehicles,
                    %{entities: [%Vehicle{ocs_trips: %{current: %{actual_departure: nil}}}]}}

    logs =
      capture_log do
        send(
          Realtime.TripMatcherServer,
          {:new_data, :vehicle_positions, %{timestamp: 5, entities: [departing]}}
        )

        assert_receive {:new_data, :vehicles,
                        %{
                          entities: [
                            %Vehicle{
                              ocs_trips: %{
                                current: %{departed: true, actual_departure: ^departed_at}
                              }
                            }
                          ]
                        }}
      end

    assert Enum.any?(
             logs,
             &String.contains?(&1, ~s(missing_current_actual_departure_time=""))
           )

    # The departure came from in-memory detection, not the vehicle_events table
    assert Orbit.Repo.all(Realtime.Data.VehicleEvent) == []
  end

  test "prunes cached departures that are older than the cache cutoff" do
    now = DateTime.utc_now()
    stale_departure = DateTime.add(now, -181, :minute)
    recent_departure = DateTime.add(now, -179, :minute)

    {:ok, _} =
      start_supervised(
        {Realtime.TripMatcherServer,
         vehicle_events: %{
           {"5484208E", "place-asmnl"} => stale_departure,
           {"547210A7", "place-asmnl"} => recent_departure
         }}
      )

    TripMatcherServer.subscribe(self())

    # Factory trips originate at Ashmont
    ocs_trips = [
      build(:ocs_trip, uid: "1", train_uid: "5484208E", assigned_at: stale_departure),
      build(:ocs_trip, uid: "2", train_uid: "547210A7", assigned_at: recent_departure)
    ]

    # Both trains have left Ashmont
    vehicle_positions = [
      build(:vehicle_position,
        vehicle_id: "R-5484208E",
        direction: 1,
        station_id: "place-smmnl",
        current_status: :IN_TRANSIT_TO
      ),
      build(:vehicle_position,
        vehicle_id: "R-547210A7",
        direction: 1,
        station_id: "place-smmnl",
        current_status: :IN_TRANSIT_TO
      )
    ]

    send(
      Realtime.TripMatcherServer,
      {:new_data, :ocs_trips, %{timestamp: 1, entities: ocs_trips}}
    )

    send(
      Realtime.TripMatcherServer,
      {:new_data, :vehicle_positions, %{timestamp: 2, entities: vehicle_positions}}
    )

    assert_receive {:new_data, :vehicles,
                    %{
                      entities: [
                        %Vehicle{
                          ocs_trips: %{current: %{departed: true, actual_departure: nil}}
                        },
                        %Vehicle{
                          ocs_trips: %{
                            current: %{departed: true, actual_departure: ^recent_departure}
                          }
                        }
                      ]
                    }}
  end
end
