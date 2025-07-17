defmodule Realtime.TripMatcher do
  require Logger
  alias Orbit.Ocs.Trip
  alias Orbit.Vehicle
  alias Realtime.Data.TripUpdate
  alias Realtime.Data.VehiclePosition

  @spec match_trips([VehiclePosition.t()], [TripUpdate.t()], [Trip.t()]) :: [Vehicle.t()]
  def match_trips(vehicle_positions, trip_updates, ocs_trips) do
    ocs_trips_by_uid =
      Enum.into(ocs_trips, %{}, fn trip ->
        {trip.uid, trip}
      end)

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

      # Find the most recently assigned trip for this train
      current_trip =
        Enum.filter(ocs_trips, fn trip ->
          trip.train_uid == vehicle_id && trip.assigned_at != nil
        end)
        |> Enum.max_by(
          fn trip -> trip.assigned_at end,
          # Use default compare function provided by DateTime
          DateTime,
          # If there are no assigned trips (empty list), current trip should be nil
          fn -> nil end
        )

      next = trip_chain(ocs_trips_by_uid, vehicle_id, current_trip && current_trip.next_uid)

      ocs_current_and_next = %{current: current_trip, next: next}

      %Vehicle{
        position: vp,
        trip_update: trip_update,
        ocs_trips: ocs_current_and_next
      }
    end)
  end

  # Look up the trip with the given start trip UID, and return the possible chain of
  # next trips from that trip onward for the given train UID.
  @spec trip_chain(%{String.t() => Trip.t()}, String.t(), String.t() | nil) :: [Trip.t()]
  defp trip_chain(trips_by_uid, train_uid, start_trip_uid)

  defp trip_chain(_trips_by_uid, _train_uid, nil) do
    []
  end

  defp trip_chain(trips_by_uid, train_uid, next_trip_uid) do
    with trip when not is_nil(trip) <- Map.get(trips_by_uid, next_trip_uid),
         # Check that trip isn't assigned to other train
         true <- trip.train_uid == nil || trip.train_uid == train_uid do
      [trip | trip_chain(trips_by_uid, train_uid, trip.next_uid)]
    else
      _ ->
        []
    end
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

        checks = %{
          missing_current_departure_station: get_in(vehicle.ocs_trips.current.origin_station),
          missing_current_scheduled_departure_time:
            get_in(vehicle.ocs_trips.current.scheduled_departure),
          missing_current_actual_departure_time: nil,
          missing_current_arrival_station: get_in(vehicle.ocs_trips.current.destination_station),
          missing_current_scheduled_arrival_time:
            get_in(vehicle.ocs_trips.current.scheduled_arrival),
          missing_current_estimated_arrival_time:
            TripUpdate.last_arrival_time(get_in(vehicle.trip_update)),
          missing_next_departure_station: next_trip && next_trip.origin_station,
          missing_next_scheduled_departure_time: next_trip && next_trip.scheduled_departure,
          missing_next_arrival_station: next_trip && next_trip.destination_station,
          missing_next_scheduled_arrival_time: next_trip && next_trip.scheduled_arrival
        }

        checks
        |> Map.new(fn {name, value} ->
          {name, (value != nil && []) || [vehicle.position.vehicle_id]}
        end)
        |> Map.merge(acc, fn _k, current, new ->
          current ++ new
        end)
      end
    )
    |> Map.put(:total, length(vehicles))
  end

  @spec statistics_log_line(map()) :: String.t()
  def statistics_log_line(statistics) do
    "trip_matcher_statistics #{Enum.map_join(statistics, " ", fn
      {key, vehicle_ids} when is_list(vehicle_ids) -> "#{key}=#{Enum.join(vehicle_ids, ",")}"
      {key, value} -> "#{key}=#{inspect(value)}"
    end)}"
  end
end
