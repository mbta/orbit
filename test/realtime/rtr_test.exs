defmodule Realtime.RTRTest do
  use ExUnit.Case, async: true

  alias Realtime.Data.VehiclePosition
  alias Realtime.RTR

  describe "VehiclePositions decode from json" do
    setup do
      {:ok, vehicle_positions} = File.read(__DIR__ <> "/VehiclePositions_enhanced.json")
      {:ok, vehicle_positions: RTR.parse_vehicle_positions(vehicle_positions)}
    end

    test "parses individual vehicle entities", context do
      assert %{
               timestamp: _time,
               entities: [_ | _]
             } = context[:vehicle_positions]
    end

    test "returns nil on empty file" do
      assert RTR.parse_vehicle_positions("") == nil
    end
  end

  describe "TripUpdates decode from json" do
    test "parses individual trip update entities" do
      {:ok, trip_updates} = File.read(__DIR__ <> "/TripUpdates_enhanced.json")

      assert %{
               timestamp: _time,
               entities: [_ | _]
             } = RTR.parse_trip_updates(trip_updates)
    end

    test "returns nil on empty file" do
      assert RTR.parse_trip_updates("") == nil
    end
  end
end
