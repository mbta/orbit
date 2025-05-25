defmodule Realtime.RTRTest do
  use ExUnit.Case, async: true

  alias Realtime.RTR

  describe "VehiclePositions decode from json" do
    setup do
      {:ok, vehicle_positions} = File.read(__DIR__ <> "/VehiclePositions_enhanced.json")
      {:ok, vehicle_positions: RTR.parse_vehicle_positions(vehicle_positions)}
    end

    test "correctly parses single entity", context do
      vp =
        Enum.filter(context[:vehicle_positions][:entities], fn vp ->
          vp.timestamp == ~U[2025-04-23 16:06:35Z]
        end)

      assert vp == [
               %Realtime.Data.VehiclePosition{
                 route_id: :Red,
                 direction: 0,
                 label: "1855",
                 cars: ["1855", "1854", "1809", "1808", "1858", "1859"],
                 position: %Util.Position{latitude: 42.36393, longitude: -71.10155},
                 heading: 130.0,
                 station_id: "place-knncl",
                 stop_id: "70071",
                 current_status: :INCOMING_AT,
                 timestamp: ~U[2025-04-23 16:06:35Z],
                 vehicle_id: "R-5482A2DC"
               }
             ]
    end

    test "parses multiple vehicle_position entities into individual structs", context do
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
    setup do
      {:ok, trip_updates_gzipped} = File.read(__DIR__ <> "/TripUpdates_enhanced.json.gz")
      trip_updates = :zlib.gunzip(trip_updates_gzipped)
      {:ok, trip_updates: RTR.parse_trip_updates(trip_updates)}
    end

    test "correctly parses single entity", context do
      tu = Enum.at(context[:trip_updates][:entities], 0)

      assert %Realtime.Data.TripUpdate{
               label: nil,
               vehicle_id: "R-5483204E",
               route_id: :Red,
               direction: 1
             } = tu

      assert tu.stop_time_updates != nil
    end

    test "parses multiple trip_update entities into individual structs", context do
      assert %{
               timestamp: _time,
               entities: [_ | _]
             } = context[:trip_updates]
    end

    test "returns nil on empty file" do
      assert RTR.parse_trip_updates("") == nil
    end
  end
end
