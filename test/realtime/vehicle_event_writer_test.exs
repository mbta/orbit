defmodule Realtime.VehicleEventWriterTest do
  use ExUnit.Case, async: true

  import Test.Support.Helpers

  alias Realtime.Data.VehicleEvent
  alias Realtime.VehicleEventWriter

  @service_date ~D[2025-07-17]

  describe "log_new_event" do
    test "logs event fields" do
      event = %VehicleEvent{
        service_date: @service_date,
        cars: ["1842", "1843", "1851", "1850", "1863", "1862"],
        vehicle_id: "R-123456",
        # South Station
        station_id: "place-sstat",
        rail_line: :red,
        direction_id: 1,
        arrival_departure: :arrival,
        timestamp: 180
      }

      logs =
        capture_log do
          VehicleEventWriter.log_new_event(event)
        end

      assert Enum.member?(
               logs,
               "[info] vehicle_event_detector new_event service_date=2025-07-17 cars=1842-1843-1851-1850-1863-1862 station_id=place-sstat vehicle_id=R-123456 direction_id=1 rail_line=red arrival_departure=arrival"
             )
    end

    test "doesn't break on nil fields" do
      event = %VehicleEvent{
        service_date: nil,
        cars: nil,
        vehicle_id: nil,
        # South Station
        station_id: nil,
        rail_line: nil,
        direction_id: nil,
        arrival_departure: nil,
        timestamp: nil
      }

      logs =
        capture_log do
          VehicleEventWriter.log_new_event(event)
        end

      assert Enum.member?(
               logs,
               "[info] vehicle_event_detector new_event service_date= cars= station_id= vehicle_id= direction_id= rail_line= arrival_departure="
             )
    end
  end
end
