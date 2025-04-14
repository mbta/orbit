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
  end
end
