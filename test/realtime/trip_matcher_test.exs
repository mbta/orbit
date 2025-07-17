defmodule Realtime.TripMatcherTest do
  use ExUnit.Case, async: true

  import Orbit.Factory

  alias Orbit.Ocs.Trip
  alias Orbit.Vehicle
  alias Realtime.Data.TripUpdate
  alias Realtime.Data.VehiclePosition
  alias Realtime.TripMatcher

  describe "OCS" do
    @test_datetime DateTime.from_iso8601("2025-07-02T20:48:00Z") |> elem(1)
    @test_datetime_plus_1m DateTime.from_iso8601("2025-07-02T20:49:00Z") |> elem(1)

    test "matches a VehiclePosition to an OCS trip on vehicle_id (train_uid) with latest assigned_at" do
      assert [
               %Vehicle{
                 ocs_trips: %{
                   current: %Trip{
                     train_uid: "5483E6C7",
                     uid: "1234FFAC"
                   },
                   next: []
                 },
                 position: %VehiclePosition{
                   vehicle_id: "R-5483E6C7",
                   trip_id: "69349212"
                 }
               }
             ] =
               Realtime.TripMatcher.match_trips(
                 [
                   %VehiclePosition{
                     vehicle_id: "R-5483E6C7",
                     trip_id: "69349212"
                   }
                 ],
                 [],
                 [
                   %Trip{
                     train_uid: "5483E6C7",
                     assigned_at: @test_datetime,
                     uid: "1234FFAB"
                   },
                   %Trip{
                     train_uid: "5483E6C7",
                     assigned_at: @test_datetime_plus_1m,
                     uid: "1234FFAC"
                   },
                   %Trip{
                     train_uid: "OTHER_TRAIN_UID",
                     uid: "1234FFAE"
                   }
                 ]
               )
    end

    test "finds chain of next OCS trips by following current trip's next_uid" do
      assert [
               %Vehicle{
                 position: %VehiclePosition{},
                 ocs_trips: %{
                   current: %Trip{
                     train_uid: "5483E6C7",
                     uid: "1234FFAC"
                   },
                   next: [
                     %Trip{
                       uid: "1234FFAD"
                     },
                     %Trip{
                       uid: "1234FFAE"
                     }
                   ]
                 }
               }
             ] =
               Realtime.TripMatcher.match_trips(
                 [
                   %VehiclePosition{
                     vehicle_id: "R-5483E6C7",
                     trip_id: "69349212"
                   }
                 ],
                 [],
                 [
                   %Trip{
                     train_uid: "5483E6C7",
                     assigned_at: @test_datetime,
                     uid: "1234FFAC",
                     next_uid: "1234FFAD"
                   },
                   %Trip{
                     uid: "1234FFAE"
                   },
                   %Trip{
                     uid: "1234FFAD",
                     next_uid: "1234FFAE"
                   }
                 ]
               )
    end

    test "ends next trip chain if other vehicle is assigned" do
      assert [
               %Vehicle{
                 position: %VehiclePosition{},
                 ocs_trips: %{
                   current: %Trip{
                     train_uid: "5483E6C7",
                     uid: "1234FFAC"
                   },
                   next: [
                     %Trip{
                       uid: "1234FFAD"
                     }
                   ]
                 }
               }
             ] =
               Realtime.TripMatcher.match_trips(
                 [
                   %VehiclePosition{
                     vehicle_id: "R-5483E6C7",
                     trip_id: "69349212"
                   }
                 ],
                 [],
                 [
                   %Trip{
                     train_uid: "5483E6C7",
                     assigned_at: @test_datetime,
                     uid: "1234FFAC",
                     next_uid: "1234FFAD"
                   },
                   %Trip{
                     train_uid: "OTHER_VEHICLE_ID",
                     uid: "1234FFAE"
                   },
                   %Trip{
                     uid: "1234FFAD",
                     next_uid: "1234FFAE"
                   }
                 ]
               )
    end

    test "ends next trip chain if a trip is missing" do
      assert [
               %Vehicle{
                 position: %VehiclePosition{},
                 ocs_trips: %{
                   current: %Trip{
                     train_uid: "5483E6C7",
                     uid: "1234FFAC"
                   },
                   next: [
                     %Trip{
                       uid: "1234FFAD"
                     }
                   ]
                 }
               }
             ] =
               Realtime.TripMatcher.match_trips(
                 [
                   %VehiclePosition{
                     vehicle_id: "R-5483E6C7",
                     trip_id: "69349212"
                   }
                 ],
                 [],
                 [
                   %Trip{
                     train_uid: "5483E6C7",
                     assigned_at: @test_datetime,
                     uid: "1234FFAC",
                     next_uid: "1234FFAD"
                   },
                   %Trip{
                     uid: "1234FFAD",
                     next_uid: "1234FFAE"
                   }
                 ]
               )
    end
  end

  test "matches a VehiclePosition to a TripUpdate on trip_id" do
    assert [
             %Vehicle{
               trip_update: %{
                 trip_id: "69349212"
               },
               position: %VehiclePosition{
                 vehicle_id: "R-5483E6C7",
                 trip_id: "69349212"
               }
             }
           ] =
             Realtime.TripMatcher.match_trips(
               [
                 %VehiclePosition{
                   vehicle_id: "R-5483E6C7",
                   trip_id: "69349212"
                 }
               ],
               [
                 %TripUpdate{
                   route_id: "Red",
                   vehicle_id: "SOME_VEHICLE_ID",
                   trip_id: "69349212"
                 }
               ],
               []
             )
  end

  describe "statistics" do
    test "everything missing" do
      assert %{
               missing_current_actual_departure_time: ["VEHICLE_ID"],
               missing_current_arrival_station: ["VEHICLE_ID"],
               missing_current_departure_station: ["VEHICLE_ID"],
               missing_current_estimated_arrival_time: ["VEHICLE_ID"],
               missing_current_scheduled_arrival_time: ["VEHICLE_ID"],
               missing_current_scheduled_departure_time: ["VEHICLE_ID"],
               missing_next_arrival_station: ["VEHICLE_ID"],
               missing_next_departure_station: ["VEHICLE_ID"],
               missing_next_scheduled_arrival_time: ["VEHICLE_ID"],
               missing_next_scheduled_departure_time: ["VEHICLE_ID"],
               total: 1
             } ==
               TripMatcher.statistics([
                 %Vehicle{
                   ocs_trips: %{
                     current: nil,
                     next: []
                   },
                   position: %VehiclePosition{
                     vehicle_id: "VEHICLE_ID"
                   }
                 }
               ])
    end

    test "missing_current_departure_station" do
      assert %{
               missing_current_departure_station: []
             } =
               TripMatcher.statistics([
                 %Vehicle{
                   trip_update: build(:trip_update),
                   position: build(:vehicle_position),
                   ocs_trips: %{
                     current:
                       build(
                         :ocs_trip,
                         origin_station: "place-asmnl"
                       ),
                     next: []
                   }
                 }
               ])
    end

    test "missing_current_scheduled_departure_time" do
      assert %{
               missing_current_scheduled_departure_time: []
             } =
               TripMatcher.statistics([
                 %Vehicle{
                   trip_update: build(:trip_update),
                   position: build(:vehicle_position),
                   ocs_trips: %{
                     current:
                       build(
                         :ocs_trip,
                         scheduled_departure: ~U[2025-06-06 12:00:00Z]
                       ),
                     next: []
                   }
                 }
               ])
    end

    test "missing_current_actual_departure_time" do
      assert %{
               missing_current_actual_departure_time: ["R-547210A7"]
             } =
               TripMatcher.statistics([
                 %Vehicle{
                   trip_update: build(:trip_update),
                   position: build(:vehicle_position),
                   ocs_trips: %{
                     current:
                       build(
                         :ocs_trip
                         # TODO: When we implement Actual Departure, this should be hooked up
                       ),
                     next: []
                   }
                 }
               ])
    end

    test "missing_current_arrival_station" do
      assert %{
               missing_current_arrival_station: []
             } =
               TripMatcher.statistics([
                 %Vehicle{
                   trip_update: build(:trip_update),
                   position: build(:vehicle_position),
                   ocs_trips: %{
                     current:
                       build(
                         :ocs_trip,
                         destination_station: "place-alfcl"
                       ),
                     next: []
                   }
                 }
               ])
    end

    test "missing_current_scheduled_arrival_time" do
      assert %{
               missing_current_scheduled_arrival_time: []
             } =
               TripMatcher.statistics([
                 %Vehicle{
                   trip_update: build(:trip_update),
                   position: build(:vehicle_position),
                   ocs_trips: %{
                     current:
                       build(
                         :ocs_trip,
                         scheduled_arrival: ~U[2025-06-06 13:00:00Z]
                       ),
                     next: []
                   }
                 }
               ])
    end

    test "missing_current_estimated_arrival_time" do
      assert %{
               missing_current_estimated_arrival_time: []
             } =
               TripMatcher.statistics([
                 %Vehicle{
                   trip_update: build(:trip_update),
                   position: build(:vehicle_position),
                   ocs_trips: %{
                     current: nil,
                     next: []
                   }
                 }
               ])
    end

    test "missing_next_departure_station" do
      assert %{
               missing_next_departure_station: []
             } =
               TripMatcher.statistics([
                 %Vehicle{
                   trip_update: nil,
                   position: build(:vehicle_position),
                   ocs_trips: %{
                     current: nil,
                     next: [build(:ocs_trip, origin_station: "place-alfcl")]
                   }
                 }
               ])
    end

    test "missing_next_scheduled_departure_time" do
      assert %{
               missing_next_scheduled_departure_time: []
             } =
               TripMatcher.statistics([
                 %Vehicle{
                   trip_update: nil,
                   position: build(:vehicle_position),
                   ocs_trips: %{
                     current: nil,
                     next: [build(:ocs_trip, scheduled_departure: ~U[2025-06-06 12:00:00Z])]
                   }
                 }
               ])
    end

    test "missing_next_arrival_station" do
      assert %{
               missing_next_arrival_station: []
             } =
               TripMatcher.statistics([
                 %Vehicle{
                   trip_update: nil,
                   position: build(:vehicle_position),
                   ocs_trips: %{
                     current: nil,
                     next: [build(:ocs_trip, destination_station: "place-asmnl")]
                   }
                 }
               ])
    end

    test "missing_next_scheduled_arrival_time" do
      assert %{
               missing_next_scheduled_arrival_time: []
             } =
               TripMatcher.statistics([
                 %Vehicle{
                   trip_update: nil,
                   position: build(:vehicle_position),
                   ocs_trips: %{
                     current: nil,
                     next: [build(:ocs_trip, scheduled_arrival: ~U[2025-06-06 13:00:00Z])]
                   }
                 }
               ])
    end

    test "total counts all vehicles" do
      assert %{
               total: 3
             } =
               TripMatcher.statistics([
                 build(:vehicle),
                 build(:vehicle),
                 build(:vehicle)
               ])
    end
  end
end
