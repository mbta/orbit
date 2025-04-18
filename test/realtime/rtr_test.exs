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
        context[:vehicle_positions][:entities]
        |> Enum.filter(fn vp -> vp.timestamp == ~U[2024-02-08 18:58:00Z] end)

      assert vp == [
               %Realtime.Data.VehiclePosition{
                 route_id: :Red,
                 direction: 1,
                 label: "1813",
                 position: %Util.Position{latitude: 42.36126, longitude: -71.07162},
                 heading: 275.0,
                 station_id: "place-chmnl",
                 current_status: :STOPPED_AT,
                 timestamp: ~U[2024-02-08 18:58:00Z],
                 vehicle_id: "R-547AA8E1"
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
      {:ok, trip_updates} = File.read(__DIR__ <> "/TripUpdates_enhanced.json")
      {:ok, trip_updates: RTR.parse_trip_updates(trip_updates)}
    end

    test "correctly parses single entity", context do
      tu = context[:trip_updates][:entities] |> Enum.at(0)
      assert %Realtime.Data.TripUpdate{
        label: "1840",
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
