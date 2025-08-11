defmodule Realtime.TripMatcherTest do
  use Orbit.DataCase, async: true

  import Orbit.Factory

  alias Orbit.Ocs.Trip
  alias Orbit.Vehicle
  alias Realtime.Data.TripUpdate
  alias Realtime.Data.TripUpdate.StopTimeUpdate
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

  test "does not match a VehiclePosition to a TripUpdate if destination mismatch" do
    assert [
             %Vehicle{
               trip_update: nil,
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
                   vehicle_id: "R-5483E6C7",
                   trip_id: "69349212",
                   stop_time_updates: [
                     %StopTimeUpdate{
                       station_id: "place-asmnl"
                     }
                   ]
                 }
               ],
               [
                 %Trip{
                   train_uid: "5483E6C7",
                   destination_station: "ALEWIFE",
                   assigned_at: @test_datetime,
                   uid: "1234FFAB"
                 }
               ]
             )
  end

  describe "statistics" do
    test "everything present" do
      assert %{
               missing_current_actual_departure_time: [],
               missing_current_arrival_station: [],
               missing_current_departure_station: [],
               missing_current_estimated_arrival_time: [],
               missing_current_scheduled_arrival_time: [],
               missing_current_scheduled_departure_time: [],
               missing_next_arrival_station: [],
               missing_next_departure_station: [],
               missing_next_scheduled_arrival_time: [],
               missing_next_scheduled_departure_time: [],
               total: 1
             } ==
               TripMatcher.statistics([
                 build(:vehicle,
                   ocs_trips: %{
                     current:
                       build(
                         :ocs_trip,
                         departed: true,
                         actual_departure: ~U[2025-06-06 12:00:00Z]
                       ),
                     next: [
                       build(:ocs_trip)
                     ]
                   },
                   position: %VehiclePosition{
                     vehicle_id: "VEHICLE_ID"
                   }
                 )
               ])
    end

    test "everything present (with explicitly unset next trip)" do
      assert %{
               missing_current_actual_departure_time: [],
               missing_current_arrival_station: [],
               missing_current_departure_station: [],
               missing_current_estimated_arrival_time: [],
               missing_current_scheduled_arrival_time: [],
               missing_current_scheduled_departure_time: [],
               missing_next_arrival_station: [],
               missing_next_departure_station: [],
               missing_next_scheduled_arrival_time: [],
               missing_next_scheduled_departure_time: [],
               total: 1
             } ==
               TripMatcher.statistics([
                 build(:vehicle,
                   ocs_trips: %{
                     current:
                       build(
                         :ocs_trip,
                         next_uid: nil,
                         departed: true,
                         actual_departure: ~U[2025-06-06 12:00:00Z]
                       ),
                     next: []
                   },
                   position: %VehiclePosition{
                     vehicle_id: "VEHICLE_ID"
                   }
                 )
               ])
    end

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

    test "next trip missing" do
      assert %{
               missing_current_actual_departure_time: [],
               missing_current_arrival_station: [],
               missing_current_departure_station: [],
               missing_current_estimated_arrival_time: [],
               missing_current_scheduled_arrival_time: [],
               missing_current_scheduled_departure_time: [],
               missing_next_arrival_station: ["VEHICLE_ID"],
               missing_next_departure_station: ["VEHICLE_ID"],
               missing_next_scheduled_arrival_time: ["VEHICLE_ID"],
               missing_next_scheduled_departure_time: ["VEHICLE_ID"],
               total: 1
             } ==
               TripMatcher.statistics([
                 build(:vehicle,
                   ocs_trips: %{
                     current: build(:ocs_trip, next_uid: "23456789"),
                     next: []
                   },
                   position: %VehiclePosition{
                     vehicle_id: "VEHICLE_ID"
                   }
                 )
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

    test "missing_current_actual_departure_time (logged for departed trip)" do
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
                         :ocs_trip,
                         departed: true
                       ),
                     next: []
                   }
                 }
               ])
    end

    test "missing_current_actual_departure_time (not logged if trip has not departed)" do
      assert %{
               missing_current_actual_departure_time: []
             } =
               TripMatcher.statistics([
                 %Vehicle{
                   trip_update: build(:trip_update),
                   position: build(:vehicle_position),
                   ocs_trips: %{
                     current: build(:ocs_trip),
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

  describe "populate_actual_departures" do
    test "gets an actual departure from the database based on vehicle_id" do
      ocs_trip = insert(:ocs_trip, train_uid: "5484208E")
      vehicle = build(:vehicle, ocs_trips: %{current: ocs_trip})
      insert(:vehicle_event, vehicle_id: "5484208E")

      assert [%{ocs_trips: %{current: %{actual_departure: ~U[2025-07-08 16:05:24Z]}}}] =
               TripMatcher.populate_actual_departures([vehicle], ~U[2025-07-08 16:30:00Z])
    end

    test "uses the most recent vehicle event" do
      ocs_trip = insert(:ocs_trip, train_uid: "5484208E")
      vehicle = build(:vehicle, ocs_trips: %{current: ocs_trip})
      insert(:vehicle_event, vehicle_id: "5484208E")
      insert(:vehicle_event, vehicle_id: "5484208E", timestamp: ~U[2025-07-08 16:25:24Z])

      assert [%{ocs_trips: %{current: %{actual_departure: ~U[2025-07-08 16:25:24Z]}}}] =
               TripMatcher.populate_actual_departures([vehicle], ~U[2025-07-08 16:30:00Z])
    end

    test "can handle multiple" do
      ocs_trip = insert(:ocs_trip, uid: "trip1", train_uid: "5484208E")
      ocs_trip2 = insert(:ocs_trip, uid: "trip2", train_uid: "5484208F")
      ocs_trip3 = insert(:ocs_trip, uid: "trip3", train_uid: "5484208G")
      vehicle = build(:vehicle, ocs_trips: %{current: ocs_trip})
      vehicle2 = build(:vehicle, ocs_trips: %{current: ocs_trip2})
      vehicle3 = build(:vehicle, ocs_trips: %{current: ocs_trip3})
      insert(:vehicle_event, vehicle_id: "5484208E")
      insert(:vehicle_event, vehicle_id: "5484208F", timestamp: ~U[2025-07-08 16:25:24Z])

      assert [
               %{
                 ocs_trips: %{
                   current: %{
                     departed: true,
                     actual_departure: ~U[2025-07-08 16:05:24Z]
                   }
                 }
               },
               %{
                 ocs_trips: %{
                   current: %{
                     departed: true,
                     actual_departure: ~U[2025-07-08 16:25:24Z]
                   }
                 }
               },
               %{
                 ocs_trips: %{
                   current: %{
                     departed: true,
                     actual_departure: nil
                   }
                 }
               }
             ] =
               TripMatcher.populate_actual_departures(
                 [vehicle, vehicle2, vehicle3],
                 ~U[2025-07-08 16:30:00Z]
               )
    end

    test "departures from other stations do not apply" do
      ocs_trip = insert(:ocs_trip, train_uid: "5484208E")
      vehicle = build(:vehicle, ocs_trips: %{current: ocs_trip})
      # The OCS trip starts at Ashmont
      insert(:vehicle_event, vehicle_id: "5484208E", station_id: "place-harsq")

      assert [%{ocs_trips: %{current: %{departed: true, actual_departure: nil}}}] =
               TripMatcher.populate_actual_departures([vehicle], ~U[2025-07-08 16:30:00Z])
    end

    test "does not get actual departure from too long ago" do
      ocs_trip = insert(:ocs_trip, train_uid: "5484208E")
      vehicle = build(:vehicle, ocs_trips: %{current: ocs_trip})
      insert(:vehicle_event, vehicle_id: "5484208E")

      assert [%{ocs_trips: %{current: %{departed: true, actual_departure: nil}}}] =
               TripMatcher.populate_actual_departures([vehicle], ~U[2025-07-08 19:30:00Z])
    end

    test "does not get actual departure when haven't left yet (must be an older event)" do
      ocs_trip = insert(:ocs_trip, train_uid: "5484208E")

      vehicle =
        build(:vehicle,
          ocs_trips: %{current: ocs_trip},
          position:
            build(
              :vehicle_position,
              station_id: "place-asmnl",
              current_status: :STOPPED_AT
            )
        )

      insert(:vehicle_event, vehicle_id: "5484208E")

      assert [%{ocs_trips: %{current: %{departed: nil, actual_departure: nil}}}] =
               TripMatcher.populate_actual_departures([vehicle], ~U[2025-07-08 16:30:00Z])
    end

    test "does not get actual departure when south of Ashmont in the turnaround" do
      ocs_trip = insert(:ocs_trip, train_uid: "5484208E")

      vehicle =
        build(:vehicle,
          ocs_trips: %{current: ocs_trip},
          position:
            build(
              :vehicle_position,
              station_id: "place-asmnl",
              current_status: :IN_TRANSIT_TO,
              direction: 1
            )
        )

      insert(:vehicle_event, vehicle_id: "5484208E")

      assert [%{ocs_trips: %{current: %{departed: nil, actual_departure: nil}}}] =
               TripMatcher.populate_actual_departures([vehicle], ~U[2025-07-08 16:30:00Z])
    end
  end
end
