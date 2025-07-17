defmodule Realtime.VehicleEventDetectorTest do
  use ExUnit.Case, async: true

  import Orbit.Factory

  alias Realtime.Data.VehicleEvent
  alias Realtime.VehicleEventDetector
  alias Realtime.VehicleEventDetector.StationEvent

  @service_date ~D[2025-07-17]

  describe "new_vehicle_events" do
    test "gets event from changed vp but not new or removed vps" do
      old_vehicle_positions = %{
        timestamp: 100,
        entities: [
          build(:vehicle_position, %{
            route_id: :Red,
            direction: 1,
            cars: ["1733", "1732", "1737", "1736", "1741", "1740"],
            # Broadway
            station_id: "place-brdwy",
            current_status: :IN_TRANSIT_TO,
            timestamp: 70
          }),
          build(:vehicle_position, %{
            route_id: :Red,
            direction: 1,
            cars: ["1862", "1863", "1850", "1851", "1843", "1842"],
            # South Station
            station_id: "place-sstat",
            current_status: :IN_TRANSIT_TO,
            timestamp: 80
          })
        ]
      }

      new_vehicle_positions = %{
        timestamp: 200,
        entities: [
          build(:vehicle_position, %{
            route_id: :Red,
            direction: 1,
            cars: ["1862", "1863", "1850", "1851", "1843", "1842"],
            # South Station
            station_id: "place-sstat",
            current_status: :STOPPED_AT,
            timestamp: 180
          }),
          build(:vehicle_position, %{
            route_id: :Red,
            direction: 1,
            cars: ["3805", "3806"],
            # Downtown Crossing
            station_id: "place-dwnxg",
            current_status: :IN_TRANSIT_TO,
            timestamp: 190
          })
        ]
      }

      assert [
               %VehicleEvent{
                 service_date: @service_date,
                 cars: ["1862", "1863", "1850", "1851", "1843", "1842"],
                 # South Station
                 station_id: "place-sstat",
                 rail_line: :red,
                 direction_id: 1,
                 arrival_departure: :arrival,
                 timestamp: 180
               }
             ] =
               VehicleEventDetector.new_vehicle_events(
                 old_vehicle_positions,
                 new_vehicle_positions,
                 @service_date
               )
    end

    test "reversed car numbers are treated as the same train" do
      old_vehicle_positions = %{
        timestamp: 100,
        entities: [
          build(:vehicle_position, %{
            route_id: :Red,
            direction: 1,
            cars: ["1733", "1732", "1737", "1736", "1741", "1740"],
            # Shawmut
            station_id: "place-smmnl",
            current_status: :IN_TRANSIT_TO,
            timestamp: 70
          }),
          build(:vehicle_position, %{
            route_id: :Red,
            direction: 1,
            cars: ["1862", "1863", "1850", "1851", "1843", "1842"],
            # South Station
            station_id: "place-sstat",
            current_status: :IN_TRANSIT_TO,
            timestamp: 80
          })
        ]
      }

      new_vehicle_positions = %{
        timestamp: 200,
        entities: [
          # Train didn't move, should not make a new departure event at Riverside
          build(:vehicle_position, %{
            route_id: :Red,
            direction: 1,
            cars: ["1740", "1741", "1736", "1737", "1732", "1733"],
            # Shawmut
            station_id: "place-smmnl",
            current_status: :IN_TRANSIT_TO,
            timestamp: 170
          }),
          # Train did move, should make a new event at South Station
          build(:vehicle_position, %{
            route_id: :Red,
            direction: 1,
            cars: ["1842", "1843", "1851", "1850", "1863", "1862"],
            # South Station
            station_id: "place-sstat",
            current_status: :STOPPED_AT,
            timestamp: 180
          })
        ]
      }

      assert [
               %VehicleEvent{
                 service_date: @service_date,
                 cars: ["1842", "1843", "1851", "1850", "1863", "1862"],
                 # South Station
                 station_id: "place-sstat",
                 rail_line: :red,
                 direction_id: 1,
                 arrival_departure: :arrival,
                 timestamp: 180
               }
             ] =
               VehicleEventDetector.new_vehicle_events(
                 old_vehicle_positions,
                 new_vehicle_positions,
                 @service_date
               )
    end
  end

  describe "VehicleEventDetector.station_events_for_one_train" do
    test "records departure from pullout if the train appears just after leaving" do
      assert [
               %StationEvent{
                 # South Station
                 station_id: "place-asmnl",
                 direction: 1,
                 arrival_departure: :departure
               }
             ] ==
               VehicleEventDetector.station_events_for_one_train({
                 nil,
                 build(:vehicle_position, %{
                   route_id: :Red,
                   station_id: "place-smmnl",
                   direction: 1,
                   current_status: :IN_TRANSIT_TO,
                   timestamp: 170
                 })
               })
    end

    test "no event for recently appeared train that hasn't just left a terminal" do
      assert [] ==
               VehicleEventDetector.station_events_for_one_train({
                 nil,
                 build(:vehicle_position, %{
                   station_id: "place-sstat",
                   direction: 1,
                   current_status: :IN_TRANSIT_TO,
                   timestamp: 70
                 })
               })
    end

    test "no event for disappeared train" do
      assert [] ==
               VehicleEventDetector.station_events_for_one_train({
                 build(:vehicle_position, %{
                   direction: 1,
                   station_id: "place-sstat",
                   current_status: :IN_TRANSIT_TO,
                   timestamp: 170
                 }),
                 nil
               })
    end

    test "new arrival for train pulling into station" do
      assert [
               %StationEvent{
                 station_id: "place-sstat",
                 direction: 1,
                 arrival_departure: :arrival
               }
             ] ==
               VehicleEventDetector.station_events_for_one_train({
                 build(:vehicle_position, %{
                   direction: 1,
                   station_id: "place-sstat",
                   current_status: :IN_TRANSIT_TO,
                   timestamp: 70
                 }),
                 build(:vehicle_position, %{
                   direction: 1,
                   station_id: "place-sstat",
                   current_status: :STOPPED_AT,
                   timestamp: 170
                 })
               })
    end

    test "new departure for train pulling out of station" do
      assert [
               %StationEvent{
                 station_id: "place-sstat",
                 direction: 1,
                 arrival_departure: :departure
               }
             ] ==
               VehicleEventDetector.station_events_for_one_train({
                 build(:vehicle_position, %{
                   direction: 1,
                   station_id: "place-sstat",
                   current_status: :STOPPED_AT,
                   timestamp: 70
                 }),
                 build(:vehicle_position, %{
                   direction: 1,
                   station_id: "place-dwnxg",
                   current_status: :IN_TRANSIT_TO,
                   timestamp: 170
                 })
               })
    end

    test "no event for stopped train in station" do
      assert [] ==
               VehicleEventDetector.station_events_for_one_train({
                 build(:vehicle_position, %{
                   direction: 1,
                   station_id: "place-sstat",
                   current_status: :STOPPED_AT,
                   timestamp: 70
                 }),
                 build(:vehicle_position, %{
                   direction: 1,
                   station_id: "place-sstat",
                   current_status: :STOPPED_AT,
                   timestamp: 170
                 })
               })
    end

    test "no event for stopped train between stations" do
      assert [] ==
               VehicleEventDetector.station_events_for_one_train({
                 build(:vehicle_position, %{
                   direction: 1,
                   station_id: "place-sstat",
                   current_status: :IN_TRANSIT_TO,
                   timestamp: 70
                 }),
                 build(:vehicle_position, %{
                   direction: 1,
                   station_id: "place-sstat",
                   current_status: :IN_TRANSIT_TO,
                   timestamp: 170
                 })
               })
    end

    test "no event for train moving on track between stations" do
      assert [] ==
               VehicleEventDetector.station_events_for_one_train({
                 build(:vehicle_position, %{
                   direction: 1,
                   station_id: "place-sstat",
                   current_status: :IN_TRANSIT_TO,
                   timestamp: 70
                 }),
                 build(:vehicle_position, %{
                   direction: 1,
                   station_id: "place-sstat",
                   current_status: :IN_TRANSIT_TO,
                   timestamp: 170
                 })
               })
    end

    test "arrival and departure for train jumping through station" do
      assert [
               %StationEvent{
                 station_id: "place-sstat",
                 direction: 1,
                 arrival_departure: :arrival
               },
               %StationEvent{
                 station_id: "place-sstat",
                 direction: 1,
                 arrival_departure: :departure
               }
             ] ==
               VehicleEventDetector.station_events_for_one_train({
                 build(:vehicle_position, %{
                   direction: 1,
                   station_id: "place-sstat",
                   current_status: :IN_TRANSIT_TO,
                   timestamp: 70
                 }),
                 build(:vehicle_position, %{
                   direction: 1,
                   station_id: "place-dwnxg",
                   current_status: :IN_TRANSIT_TO,
                   timestamp: 170
                 })
               })
    end

    test "departure and arrival for train jumping from one station to the next" do
      assert [
               %StationEvent{
                 station_id: "place-sstat",
                 direction: 1,
                 arrival_departure: :departure
               },
               %StationEvent{
                 station_id: "place-dwnxg",
                 direction: 1,
                 arrival_departure: :arrival
               }
             ] ==
               VehicleEventDetector.station_events_for_one_train({
                 build(:vehicle_position, %{
                   direction: 1,
                   station_id: "place-sstat",
                   current_status: :STOPPED_AT,
                   timestamp: 70
                 }),
                 build(:vehicle_position, %{
                   direction: 1,
                   station_id: "place-dwnxg",
                   current_status: :STOPPED_AT,
                   timestamp: 170
                 })
               })
    end

    test "no event if jumping to a station that's not immediately next" do
      assert [] ==
               VehicleEventDetector.station_events_for_one_train({
                 build(:vehicle_position, %{
                   direction: 1,
                   station_id: "place-sstat",
                   current_status: :STOPPED_AT,
                   timestamp: 70
                 }),
                 build(:vehicle_position, %{
                   direction: 1,
                   # Park Street
                   station_id: "place-pktrm",
                   current_status: :IN_TRANSIT_TO,
                   timestamp: 170
                 })
               })
    end

    test "new event even if train changes route id" do
      assert [
               %StationEvent{
                 station_id: "place-sstat",
                 direction: 1,
                 arrival_departure: :arrival
               }
             ] ==
               VehicleEventDetector.station_events_for_one_train({
                 build(:vehicle_position, %{
                   route_id: :Red,
                   direction: 1,
                   station_id: "place-sstat",
                   current_status: :IN_TRANSIT_TO,
                   timestamp: 70
                 }),
                 build(:vehicle_position, %{
                   route_id: :Red,
                   direction: 1,
                   station_id: "place-sstat",
                   current_status: :STOPPED_AT,
                   timestamp: 170
                 })
               })
    end

    test "no event if train goes from in a station to before that station" do
      assert [] ==
               VehicleEventDetector.station_events_for_one_train({
                 build(:vehicle_position, %{
                   direction: 1,
                   station_id: "place-sstat",
                   current_status: :STOPPED_AT,
                   timestamp: 70
                 }),
                 build(:vehicle_position, %{
                   direction: 1,
                   station_id: "place-sstat",
                   current_status: :IN_TRANSIT_TO,
                   timestamp: 170
                 })
               })
    end

    test "treats IN_TRANSIT_TO and INCOMING_AT the same" do
      assert [
               %StationEvent{
                 station_id: "place-sstat",
                 direction: 1,
                 arrival_departure: :arrival
               }
             ] ==
               VehicleEventDetector.station_events_for_one_train({
                 build(:vehicle_position, %{
                   direction: 1,
                   station_id: "place-sstat",
                   current_status: :INCOMING_AT,
                   timestamp: 70
                 }),
                 build(:vehicle_position, %{
                   direction: 1,
                   station_id: "place-sstat",
                   current_status: :STOPPED_AT,
                   timestamp: 170
                 })
               })
    end

    test "no event for train switching direction within station" do
      assert [] ==
               VehicleEventDetector.station_events_for_one_train({
                 build(:vehicle_position, %{
                   direction: 1,
                   station_id: "place-sstat",
                   current_status: :STOPPED_AT,
                   timestamp: 70
                 }),
                 build(:vehicle_position, %{
                   direction: 0,
                   station_id: "place-sstat",
                   current_status: :STOPPED_AT,
                   timestamp: 170
                 })
               })
    end

    test "no event if switching direction and jumping to a station that's not adjacent" do
      assert [] ==
               VehicleEventDetector.station_events_for_one_train({
                 build(:vehicle_position, %{
                   direction: 1,
                   station_id: "place-sstat",
                   current_status: :STOPPED_AT,
                   timestamp: 70
                 }),
                 build(:vehicle_position, %{
                   direction: 0,
                   station_id: "place-pktrm",
                   current_status: :STOPPED_AT,
                   timestamp: 170
                 })
               })
    end

    test "no event if switching direction at a station that's not adjacent" do
      assert [] ==
               VehicleEventDetector.station_events_for_one_train({
                 build(:vehicle_position, %{
                   direction: 1,
                   station_id: "place-sstat",
                   current_status: :STOPPED_AT,
                   timestamp: 70
                 }),
                 build(:vehicle_position, %{
                   direction: 0,
                   station_id: "place-pktrm",
                   current_status: :STOPPED_AT,
                   timestamp: 170
                 })
               })
    end

    test "departure and arrival in new direction when jumping to previous station in reverse direction" do
      assert [
               %StationEvent{
                 station_id: "place-sstat",
                 direction: 0,
                 arrival_departure: :departure
               },
               %StationEvent{
                 station_id: "place-brdwy",
                 direction: 0,
                 arrival_departure: :arrival
               }
             ] ==
               VehicleEventDetector.station_events_for_one_train({
                 build(:vehicle_position, %{
                   direction: 1,
                   station_id: "place-sstat",
                   current_status: :STOPPED_AT,
                   timestamp: 70
                 }),
                 build(:vehicle_position, %{
                   direction: 0,
                   station_id: "place-brdwy",
                   current_status: :STOPPED_AT,
                   timestamp: 170
                 })
               })
    end

    test "departure in new direction when reversing direction while leaving a station" do
      assert [
               %StationEvent{
                 station_id: "place-sstat",
                 direction: 0,
                 arrival_departure: :departure
               }
             ] ==
               VehicleEventDetector.station_events_for_one_train({
                 build(:vehicle_position, %{
                   direction: 1,
                   station_id: "place-sstat",
                   current_status: :STOPPED_AT,
                   timestamp: 70
                 }),
                 build(:vehicle_position, %{
                   direction: 0,
                   station_id: "place-brdwy",
                   current_status: :IN_TRANSIT_TO,
                   timestamp: 170
                 })
               })
    end

    test "departure in old direction when turning around after leaving the station" do
      assert [
               %StationEvent{
                 station_id: "place-sstat",
                 direction: 1,
                 arrival_departure: :departure
               }
             ] ==
               VehicleEventDetector.station_events_for_one_train({
                 build(:vehicle_position, %{
                   direction: 1,
                   station_id: "place-sstat",
                   current_status: :STOPPED_AT,
                   timestamp: 70
                 }),
                 build(:vehicle_position, %{
                   direction: 0,
                   station_id: "place-sstat",
                   current_status: :IN_TRANSIT_TO,
                   timestamp: 170
                 })
               })
    end

    test "departure and arrival in old direction when jumping to next station, then turning around" do
      assert [
               %StationEvent{
                 station_id: "place-sstat",
                 direction: 1,
                 arrival_departure: :departure
               },
               %StationEvent{
                 station_id: "place-dwnxg",
                 direction: 1,
                 arrival_departure: :arrival
               }
             ] ==
               VehicleEventDetector.station_events_for_one_train({
                 build(:vehicle_position, %{
                   direction: 1,
                   station_id: "place-sstat",
                   current_status: :STOPPED_AT,
                   timestamp: 70
                 }),
                 build(:vehicle_position, %{
                   direction: 0,
                   station_id: "place-dwnxg",
                   current_status: :STOPPED_AT,
                   timestamp: 170
                 })
               })
    end

    test "arrival in new direction when turning around and entering previous station" do
      assert [
               %StationEvent{
                 station_id: "place-brdwy",
                 direction: 0,
                 arrival_departure: :arrival
               }
             ] ==
               VehicleEventDetector.station_events_for_one_train({
                 build(:vehicle_position, %{
                   direction: 1,
                   station_id: "place-sstat",
                   current_status: :IN_TRANSIT_TO,
                   timestamp: 70
                 }),
                 build(:vehicle_position, %{
                   direction: 0,
                   station_id: "place-brdwy",
                   current_status: :STOPPED_AT,
                   timestamp: 170
                 })
               })
    end

    test "no event when turning around between stations" do
      assert [] ==
               VehicleEventDetector.station_events_for_one_train({
                 build(:vehicle_position, %{
                   direction: 1,
                   station_id: "place-sstat",
                   current_status: :IN_TRANSIT_TO,
                   timestamp: 70
                 }),
                 build(:vehicle_position, %{
                   direction: 0,
                   station_id: "place-brdwy",
                   current_status: :IN_TRANSIT_TO,
                   timestamp: 170
                 })
               })
    end

    test "arrival in old direction when turning around after entering station" do
      assert [
               %StationEvent{
                 station_id: "place-sstat",
                 direction: 1,
                 arrival_departure: :arrival
               }
             ] ==
               VehicleEventDetector.station_events_for_one_train({
                 build(:vehicle_position, %{
                   direction: 1,
                   station_id: "place-sstat",
                   current_status: :IN_TRANSIT_TO,
                   timestamp: 70
                 }),
                 build(:vehicle_position, %{
                   direction: 0,
                   station_id: "place-sstat",
                   current_status: :STOPPED_AT,
                   timestamp: 170
                 })
               })
    end

    test "arrival and departure in old direction when jumping over a station then turning around" do
      assert [
               %StationEvent{
                 station_id: "place-sstat",
                 direction: 1,
                 arrival_departure: :arrival
               },
               %StationEvent{
                 station_id: "place-sstat",
                 direction: 1,
                 arrival_departure: :departure
               }
             ] ==
               VehicleEventDetector.station_events_for_one_train({
                 build(:vehicle_position, %{
                   direction: 1,
                   station_id: "place-sstat",
                   current_status: :IN_TRANSIT_TO,
                   timestamp: 70
                 }),
                 build(:vehicle_position, %{
                   direction: 0,
                   station_id: "place-sstat",
                   current_status: :IN_TRANSIT_TO,
                   timestamp: 170
                 })
               })
    end

    test "arrival, departure, and arrival when jumping over a station into the next one" do
      assert [
               %StationEvent{
                 station_id: "place-sstat",
                 direction: 1,
                 arrival_departure: :arrival
               },
               %StationEvent{
                 station_id: "place-sstat",
                 direction: 1,
                 arrival_departure: :departure
               },
               %StationEvent{
                 station_id: "place-dwnxg",
                 direction: 1,
                 arrival_departure: :arrival
               }
             ] ==
               VehicleEventDetector.station_events_for_one_train({
                 build(:vehicle_position, %{
                   direction: 1,
                   station_id: "place-sstat",
                   current_status: :IN_TRANSIT_TO,
                   timestamp: 70
                 }),
                 build(:vehicle_position, %{
                   direction: 1,
                   station_id: "place-dwnxg",
                   current_status: :STOPPED_AT,
                   timestamp: 170
                 })
               })
    end

    test "arrival, departure, and arrival when jumping over a station into the next one and turning around" do
      assert [
               %StationEvent{
                 station_id: "place-sstat",
                 direction: 1,
                 arrival_departure: :arrival
               },
               %StationEvent{
                 station_id: "place-sstat",
                 direction: 1,
                 arrival_departure: :departure
               },
               %StationEvent{
                 station_id: "place-dwnxg",
                 direction: 1,
                 arrival_departure: :arrival
               }
             ] ==
               VehicleEventDetector.station_events_for_one_train({
                 build(:vehicle_position, %{
                   direction: 1,
                   station_id: "place-sstat",
                   current_status: :IN_TRANSIT_TO,
                   timestamp: 70
                 }),
                 build(:vehicle_position, %{
                   direction: 0,
                   station_id: "place-dwnxg",
                   current_status: :STOPPED_AT,
                   timestamp: 170
                 })
               })
    end
  end
end
