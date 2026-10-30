defmodule Realtime.Data.VehicleEventTest do
  use Orbit.DataCase, async: true

  import Orbit.Factory

  alias Realtime.Data.VehicleEvent

  describe "recent_departures/1" do
    @now ~U[2025-07-08 16:30:00Z]

    test "returns departures keyed by vehicle_id and station_id" do
      insert(:vehicle_event, vehicle_id: "5484208E")
      insert(:vehicle_event, vehicle_id: "5484208F", station_id: "place-alfcl")

      assert %{
               {"5484208E", "place-asmnl"} => %{timestamp: ~U[2025-07-08 16:05:24Z]},
               {"5484208F", "place-alfcl"} => %{timestamp: ~U[2025-07-08 16:05:24Z]}
             } = VehicleEvent.recent_departures(@now)
    end

    test "uses the most recent departure for a vehicle and station" do
      insert(:vehicle_event, vehicle_id: "5484208E")
      insert(:vehicle_event, vehicle_id: "5484208E", timestamp: ~U[2025-07-08 16:25:24Z])

      assert %{{"5484208E", "place-asmnl"} => %{timestamp: ~U[2025-07-08 16:25:24Z]}} =
               VehicleEvent.recent_departures(@now)
    end

    test "does not include departures from too long ago" do
      insert(:vehicle_event, vehicle_id: "5484208E")

      assert %{} == VehicleEvent.recent_departures(~U[2025-07-08 19:30:00Z])
    end

    test "does not include departures from other service dates" do
      insert(:vehicle_event, vehicle_id: "5484208E", service_date: ~D[2025-07-07])

      assert %{} == VehicleEvent.recent_departures(@now)
    end

    test "does not include arrivals" do
      insert(:vehicle_event, vehicle_id: "5484208E", arrival_departure: :arrival)

      assert %{} == VehicleEvent.recent_departures(@now)
    end
  end
end
