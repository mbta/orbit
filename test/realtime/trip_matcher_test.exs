defmodule Realtime.TripMatcherTest do
  use ExUnit.Case, async: true

  alias Orbit.Ocs.Trip
  alias Orbit.Vehicle
  alias Realtime.Data.TripUpdate
  alias Realtime.Data.VehiclePosition

  describe "OCS" do
    test "matches a VehiclePosition to an OCS trip on vehicle_id (train_uid)" do
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
                     uid: "1234FFAC"
                   }
                 ]
               )
    end

    test "finds other OCS trips by vehicle_id (train_uid)" do
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
                       train_uid: "5483E6C7",
                       uid: "1234FFAE"
                     },
                     %Trip{
                       train_uid: "5483E6C7",
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
                     uid: "1234FFAC"
                   },
                   %Trip{
                     train_uid: "5483E6C7",
                     uid: "1234FFAD"
                   },
                   %Trip{
                     train_uid: "5483E6C7",
                     uid: "1234FFAE"
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
end
