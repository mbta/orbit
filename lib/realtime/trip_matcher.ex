defmodule Realtime.TripMatcher do
  require Logger
  alias Orbit.Ocs.Trip
  alias Orbit.Vehicle
  alias Realtime.Data.TripUpdate
  alias Realtime.Data.VehiclePosition

  @spec match_trips([VehiclePosition.t()], [TripUpdate.t()], [Trip.t()]) :: [Vehicle.t()]
  def match_trips(vehicle_positions, trip_updates, ocs_trips) do
    Enum.map(vehicle_positions, fn vp ->
      vehicle_id =
        case vp.vehicle_id do
          "O-" <> vehicle_id -> vehicle_id
          "R-" <> vehicle_id -> vehicle_id
          "B-" <> vehicle_id -> vehicle_id
        end

      trip_update =
        Enum.find(trip_updates, fn trip_update ->
          trip_update.trip_id == vp.trip_id
        end)

      ocs_current_and_next =
        Enum.reduce(ocs_trips, %{current: nil, next: []}, fn trip, acc ->
          if trip.train_uid == vehicle_id do
            # credo:disable-for-next-line
            case acc.current do
              nil -> %{current: trip, next: acc.next}
              _ -> %{current: acc.current, next: [trip | acc.next]}
            end
          else
            acc
          end
        end)

      %Vehicle{
        position: vp,
        trip_update: trip_update,
        ocs_trips: ocs_current_and_next
      }
    end)
  end

  @spec statistics([Vehicle.t()]) :: map()
  def statistics(vehicles) do
    Enum.reduce(
      vehicles,
      %{},
      fn vehicle, acc ->
        next_trip =
          case get_in(vehicle.ocs_trips.next) do
            [trip] -> trip
            [trip | _] -> trip
            [] -> nil
            nil -> nil
          end

        %{
          missing_current_departure_station:
            (get_in(vehicle.ocs_trips.current.origin_station) != nil && 0) || 1,
          missing_current_scheduled_departure_time:
            (get_in(vehicle.ocs_trips.current.scheduled_departure) != nil && 0) || 1,
          missing_current_actual_departure_time: 1,
          missing_current_arrival_station:
            (get_in(vehicle.ocs_trips.current.destination_station) != nil && 0) || 1,
          missing_current_scheduled_arrival_time:
            (get_in(vehicle.ocs_trips.current.scheduled_arrival) != nil && 0) || 1,
          missing_current_estimated_arrival_time:
            (TripUpdate.last_arrival_time(get_in(vehicle.trip_update)) != nil && 0) || 1,
          missing_next_departure_station:
            (next_trip && next_trip.origin_station != nil && 0) || 1,
          missing_next_scheduled_departure_time:
            (next_trip && next_trip.scheduled_departure != nil && 0) || 1,
          missing_next_arrival_station:
            (next_trip && next_trip.destination_station != nil && 0) || 1,
          missing_next_scheduled_arrival_time:
            (next_trip && next_trip.scheduled_arrival != nil && 0) || 1,
          total: 1
        }
        |> Map.merge(acc, fn _k, current_total, new_value ->
          current_total + new_value
        end)
      end
    )
  end

  @spec statistics_log_line(map()) :: String.t()
  def statistics_log_line(statistics) do
    "trip_matcher_statistics #{Enum.map_join(statistics, " ", fn {name, count} -> "#{name}=#{count}" end)}"
  end
end
