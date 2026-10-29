defmodule Realtime.TripMatcher do
  require Logger

  alias Orbit.Ocs.Trip
  alias Orbit.Ocs.Utilities.Stations
  alias Orbit.Vehicle

  alias Realtime.Data.TripUpdate
  alias Realtime.Data.VehicleEvent
  alias Realtime.Data.VehiclePosition

  @type departure_lookup :: %{
          {vehicle_id :: String.t(), station_id :: String.t()} => VehicleEvent.t()
        }

  @spec match_trips([VehiclePosition.t()], [TripUpdate.t()], [Trip.t()], departure_lookup()) :: [
          Vehicle.t()
        ]
  def match_trips(vehicle_positions, trip_updates, ocs_trips, events) do
    ocs_trips_by_uid =
      Enum.into(ocs_trips, %{}, fn trip ->
        {trip.uid, trip}
      end)

    Enum.map(vehicle_positions, fn vp ->
      vehicle_id = Realtime.Data.unprefixed_vehicle_id(vp.vehicle_id)

      # Find OCS trip: the most recently assigned trip for this train
      sorted_trips =
        Enum.filter(ocs_trips, fn trip ->
          trip.train_uid == vehicle_id && trip.assigned_at != nil
        end)
        |> Enum.sort_by(fn trip -> DateTime.to_unix(trip.assigned_at) end, :desc)

      {current_trip, past_trips} =
        case sorted_trips do
          [current_trip | past_trips] -> {current_trip, past_trips}
          [] -> {nil, []}
        end

      next_trips = next_trip_chain(ocs_trips_by_uid, vehicle_id, current_trip)

      # Find TripUpdate
      trip_update =
        Enum.find(trip_updates, fn trip_update ->
          trip_update.trip_id == vp.trip_id
        end)

      %Vehicle{
        position: vp,
        trip_update: trip_update,
        ocs_trips: %{
          current: current_trip,
          next: next_trips,
          past: past_trips
        }
      }
    end)
    |> populate_actual_departures(events)
  end

  # For the given current Trip and train UID, find the sequence of "next" trips
  # after the current trip for the that same train.
  @spec next_trip_chain(%{String.t() => Trip.t()}, String.t(), Trip.t() | nil) ::
          [
            Trip.t()
          ]
  defp next_trip_chain(trips_by_uid, train_uid, current_trip)

  defp next_trip_chain(_trips_by_uid, _train_uid, nil) do
    []
  end

  defp next_trip_chain(trips_by_uid, train_uid, current_trip) do
    {status, chain} =
      trip_chain_recursive(
        trips_by_uid,
        train_uid,
        current_trip.next_uid,
        MapSet.new([current_trip.uid])
      )

    if status == :loop_detected do
      next_trip_uids = Enum.map_join(chain, ", ", fn trip -> trip.uid end)

      Logger.warning(
        "Realtime.TripMatcher ocs_trip_loop_detected trip_uid=#{current_trip.uid} next_uids=[#{next_trip_uids}]"
      )
    end

    chain
  end

  # Look up the trip with the given start trip UID, and return the possible chain of
  # next trips from that trip onward for the given train UID.
  # The 'visited' MapSet contains trip UIDs visited so far, and is used to detect and avoid loops.
  # If a loop does occur, the sequence up until the loop was detected will be reported as the next
  # set of trips.
  @spec trip_chain_recursive(
          %{String.t() => Trip.t()},
          String.t(),
          String.t() | nil,
          MapSet.t(String.t())
        ) ::
          {:ok | :loop_detected,
           [
             Trip.t()
           ]}
  defp trip_chain_recursive(trips_by_uid, train_uid, start_trip_uid, visited)

  defp trip_chain_recursive(_trips_by_uid, _train_uid, nil, _visited) do
    {:ok, []}
  end

  defp trip_chain_recursive(trips_by_uid, train_uid, next_trip_uid, visited) do
    if MapSet.member?(visited, next_trip_uid) do
      # We detected a loop in the next_trip_uid chain sent from OCS.
      # End the sequence here.
      {:loop_detected, []}
    else
      with trip when not is_nil(trip) <- Map.get(trips_by_uid, next_trip_uid),
           # Check that trip isn't assigned to other train
           true <- trip.train_uid == nil || trip.train_uid == train_uid,
           {status, trip_chain} <-
             trip_chain_recursive(
               trips_by_uid,
               train_uid,
               trip.next_uid,
               MapSet.put(visited, next_trip_uid)
             ) do
        {status, [trip | trip_chain]}
      else
        _ ->
          {:ok, []}
      end
    end
  end

  @spec mid_trip?(Vehicle.t()) :: boolean()
  def mid_trip?(%Vehicle{position: pos}) do
    near_terminal? = pos.station_id in ["place-alfcl", "place-asmnl", "place-brntn"]

    approaching_first_stop? =
      case {pos.station_id, pos.direction} do
        {"place-davis", 0} -> true
        {"place-smmnl", 1} -> true
        {"place-qamnl", 1} -> true
        _ -> false
      end

    # checking that the vehicle is likely mid-trip down the line
    # i.e it's not near a terminal and not still approaching the first stop
    not near_terminal? and not approaching_first_stop? and !is_nil(pos.station_id)
  end

  @spec statistics([Vehicle.t()]) :: map()
  def statistics(vehicles) do
    Enum.reduce(
      vehicles,
      %{},
      fn vehicle, acc ->
        current_trip = get_in(vehicle.ocs_trips.current)

        next_trip =
          case get_in(vehicle.ocs_trips.next) do
            [trip] -> trip
            [trip | _] -> trip
            [] -> nil
            nil -> nil
          end

        ignore_next_trip = current_trip && current_trip.next_uid == nil

        # The current trip's actual departure time is expected to be missing if it (1) has not
        # departed, or (2) originates from a nonrevenue location.
        ignore_actual_departure? =
          current_trip &&
            (!current_trip.departed or nonrevenue_origin?(current_trip))

        checks = %{
          missing_current_departure_station:
            current_trip && Trip.get_origin_station(vehicle.ocs_trips.current),
          missing_current_scheduled_departure_time:
            current_trip && current_trip.scheduled_departure,
          missing_current_actual_departure_time:
            ignore_actual_departure? || (current_trip && current_trip.actual_departure),
          missing_current_arrival_station:
            current_trip && Trip.get_destination_station(current_trip),
          missing_current_scheduled_arrival_time: current_trip && current_trip.scheduled_arrival,
          missing_current_estimated_arrival_time:
            TripUpdate.last_arrival_time(get_in(vehicle.trip_update)),
          missing_next_departure_station:
            ignore_next_trip || (next_trip && Trip.get_origin_station(next_trip)),
          missing_next_scheduled_departure_time:
            ignore_next_trip || (next_trip && next_trip.scheduled_departure),
          missing_next_arrival_station:
            ignore_next_trip || (next_trip && Trip.get_destination_station(next_trip)),
          missing_next_scheduled_arrival_time:
            ignore_next_trip || (next_trip && next_trip.scheduled_arrival),
          large_delta_between_scheduled_actual_departures:
            case vehicle.ocs_trips.current do
              %{actual_departure: actual, scheduled_departure: scheduled}
              when not is_nil(actual) and not is_nil(scheduled) ->
                if mid_trip?(vehicle) and
                     abs(DateTime.diff(actual, scheduled, :minute)) >= 45,
                   do: nil,
                   else: true

              _ ->
                true
            end
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
      {key, vehicle_ids} when is_list(vehicle_ids) -> "#{key}=\"#{Enum.join(vehicle_ids, ",")}\""
      {key, value} -> "#{key}=#{inspect(value)}"
    end)}"
  end

  @spec populate_actual_departures([Vehicle.t()], departure_lookup()) :: [Vehicle.t()]
  def populate_actual_departures(vehicles, events) do
    Enum.map(vehicles, &populate_actual_departure(&1, events))
  end

  @spec populate_actual_departure(Vehicle.t(), departure_lookup()) :: Vehicle.t()
  defp populate_actual_departure(vehicle, departures) do
    %{ocs_trips: %{current: current, past: past}} = vehicle

    origin_station = current && Trip.get_origin_station(current)

    # If the vehicle's trip has a known revenue location as its origin, check that the vehicle is not
    # stopped at that station. For nonrevenue origins, we will assume that the vehicle has already departed
    # or else we would not have gotten a vehicle position from GTFS realtime.
    departed? =
      origin_station != nil and
        not (Stations.revenue?(origin_station) and
               at_station?(vehicle, Stations.ocs_to_gtfs(origin_station)))

    if departed? do
      actual_departure =
        Map.get(departures, {current.train_uid, Stations.ocs_to_gtfs(origin_station)})

      vehicle = put_in(vehicle.ocs_trips.current.departed, true)

      # Check that this departure isn't actually for a prior trip, which could happen if the current
      # trip's departure has not been detected
      best_trip =
        actual_departure && best_matching_trip_for_departure([current | past], actual_departure)

      if best_trip == current do
        put_in(vehicle.ocs_trips.current.actual_departure, actual_departure.timestamp)
      else
        vehicle
      end
    else
      vehicle
    end
  end

  @spec nonrevenue_origin?(Trip.t()) :: boolean()
  defp nonrevenue_origin?(trip) do
    origin_station = Trip.get_origin_station(trip)
    origin_station != nil and not Stations.revenue?(origin_station)
  end

  @spec at_station?(Vehicle.t(), String.t()) :: boolean()
  defp at_station?(vehicle, station) do
    # NB pm: Ashmont exception
    #   Vehicles turning around south of Ashmont are IN_TRANSIT_TO Ashmont, but for the purposes of
    #   determining whether we should show an Actual Departure, they are stopped there.
    stopped =
      vehicle.position.current_status == :STOPPED_AT or
        (vehicle.position.station_id == "place-asmnl" and vehicle.position.direction == 1)

    # Check if stopped at the OCS origin_station
    stopped and vehicle.position.station_id == station
  end

  @spec best_matching_trip_for_departure([Trip.t()], VehicleEvent.t()) :: Trip.t() | nil
  defp best_matching_trip_for_departure(trips, event) do
    {best_trip, _} =
      trips
      |> Enum.map(fn trip -> {trip, match_departure?(trip, event)} end)
      |> Enum.reject(fn {_trip, {result, _}} -> result == :no_match end)
      |> Enum.min_by(fn {_trip, {:match, penalty}} -> penalty end, fn -> {nil, nil} end)

    best_trip
  end

  @spec match_departure?(Trip.t(), VehicleEvent.t()) ::
          {:match, penalty :: integer()} | {:no_match, :wrong_station | :missing_departure_time}
  defp match_departure?(ocs_trip, vehicle_event) do
    origin_station = Trip.get_origin_station(ocs_trip) |> Stations.ocs_to_gtfs()
    dest_station = Trip.get_destination_station(ocs_trip) |> Stations.ocs_to_gtfs()
    trip_direction = Realtime.Data.Stations.direction_from_stations(origin_station, dest_station)

    matches_direction? =
      trip_direction == :ambiguous or trip_direction == vehicle_event.direction_id

    cond do
      not matches_direction? ->
        {:no_match, :wrong_direction}

      origin_station != vehicle_event.station_id ->
        {:no_match, :wrong_station}

      ocs_trip.scheduled_departure == nil and ocs_trip.assigned_at == nil ->
        {:no_match, :missing_departure_time}

      true ->
        expected_departure_time =
          if ocs_trip.scheduled_departure != nil do
            DateTime.add(ocs_trip.scheduled_departure, ocs_trip.offset || 0)
          else
            ocs_trip.assigned_at
          end

        difference = DateTime.diff(vehicle_event.timestamp, expected_departure_time)
        {:match, abs(difference)}
    end
  end
end
