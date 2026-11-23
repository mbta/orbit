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
                 revenue: true,
                 direction: 0,
                 label: "1855",
                 cars: ["1855", "1854", "1809", "1808", "1858", "1859"],
                 position: %Util.Position{latitude: 42.36393, longitude: -71.10155},
                 heading: 130.0,
                 station_id: "place-knncl",
                 stop_id: "70071",
                 current_status: :INCOMING_AT,
                 timestamp: ~U[2025-04-23 16:06:35Z],
                 vehicle_id: "R-5482A2DC",
                 trip_id: "67994935"
               }
             ]
    end

    test "defaults revenue field to true even if absent in json", context do
      vp =
        Enum.find(context[:vehicle_positions][:entities], fn vp ->
          vp.vehicle_id == "R-5482AB14"
        end)

      assert %Realtime.Data.VehiclePosition{
               revenue: true
             } = vp
    end

    test "Blue and Orange vehicle positions resolve platform stops to stations", context do
      for route <- [:Blue, :Orange] do
        positions = Enum.filter(context.vehicle_positions.entities, &(&1.route_id == route))
        assert positions != []
        assert Enum.all?(positions, &is_binary(&1.station_id))
      end
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
               label: "1829",
               vehicle_id: "R-5483F718",
               route_id: :Red,
               direction: 0
             } = tu

      assert tu.stop_time_updates != nil
    end

    test "parses multiple trip_update entities into individual structs", context do
      assert %{
               timestamp: _time,
               entities: [_ | _]
             } = context[:trip_updates]
    end

    test "parses passthrough_time as predicted_arrival_time for nonrev trips", context do
      nonrev_tu =
        Enum.find(context[:trip_updates][:entities], fn tu ->
          tu.trip_id == "NONREV-1580674622"
        end)

      assert Enum.at(nonrev_tu.stop_time_updates, 1).predicted_arrival_time ==
               1_751_553_175
    end

    test "Blue and Orange trip updates resolve every platform stop to a station", context do
      for {route, first_station} <- [Blue: "place-bomnl", Orange: "place-grnst"] do
        updates = Enum.filter(context.trip_updates.entities, &(&1.route_id == route))
        assert updates != []
        assert hd(hd(updates).stop_time_updates).station_id == first_station

        assert Enum.all?(updates, fn update ->
                 Enum.all?(update.stop_time_updates, &is_binary(&1.station_id))
               end)
      end
    end

    test "returns nil on empty file" do
      assert RTR.parse_trip_updates("") == nil
    end
  end
end
