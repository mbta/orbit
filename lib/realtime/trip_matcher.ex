defmodule Realtime.TripMatcher do
  require Logger
  import Ecto.Query

  alias Orbit.Ocs.Trip
  alias Orbit.Ocs.Utilities.Stations
  alias Orbit.Repo
  alias Orbit.Vehicle

  alias Realtime.Data.TripUpdate
  alias Realtime.Data.VehicleEvent
  alias Realtime.Data.VehiclePosition

  @event_search_cutoff_m -180

  @spec match_trips([VehiclePosition.t()], [TripUpdate.t()], [Trip.t()]) :: [Vehicle.t()]
  def match_trips(vehicle_positions, trip_updates, ocs_trips) do
    ocs_trips_by_uid =
      Enum.into(ocs_trips, %{}, fn trip ->
        {trip.uid, trip}
      end)

    Enum.map(vehicle_positions, fn vp ->
      vehicle_id = Realtime.Data.unprefixed_vehicle_id(vp.vehicle_id)

      # Find OCS trip: the most recently assigned trip for this train
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

      next =
        next_trip_chain(
          ocs_trips_by_uid,
          vehicle_id,
          current_trip
        )

      ocs_current_and_next = %{current: current_trip, next: next}

      ocs_current_destination_gtfs =
        case current_trip do
          %Trip{destination_station: destination_station} ->
            Stations.ocs_to_gtfs(destination_station)

          _ ->
            nil
        end

      # Find TripUpdate

      trip_update =
        Enum.find(trip_updates, fn trip_update ->
          arrival_station = TripUpdate.last_arrival_stop(trip_update)

          # The last prediction in the TripUpdate (i.e. the destination) must match the OCS
          #  trip. Before this, vehicles at Ashmont SB that are assigned to the next NB
          #  trip in OCS, but not RTR yet (due to the turnaround), will have an old estimated
          #  arrival
          # https://app.asana.com/1/15492006741476/project/1206105669438487/task/1210824268353890

          arrival_station == ocs_current_destination_gtfs and
            trip_update.trip_id == vp.trip_id
        end)

      %Vehicle{
        position: vp,
        trip_update: trip_update,
        ocs_trips: ocs_current_and_next
      }
    end)
    |> populate_actual_departures(DateTime.utc_now())
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

        ignore_next_trip = vehicle.ocs_trips.current && vehicle.ocs_trips.current.next_uid == nil

        ignore_actual_departure? =
          vehicle.ocs_trips.current && !vehicle.ocs_trips.current.departed

        checks = %{
          missing_current_departure_station: get_in(vehicle.ocs_trips.current.origin_station),
          missing_current_scheduled_departure_time:
            get_in(vehicle.ocs_trips.current.scheduled_departure),
          missing_current_actual_departure_time:
            ignore_actual_departure? || get_in(vehicle.ocs_trips.current.actual_departure),
          missing_current_arrival_station: get_in(vehicle.ocs_trips.current.destination_station),
          missing_current_scheduled_arrival_time:
            get_in(vehicle.ocs_trips.current.scheduled_arrival),
          missing_current_estimated_arrival_time:
            TripUpdate.last_arrival_time(get_in(vehicle.trip_update)),
          missing_next_departure_station:
            ignore_next_trip || (next_trip && next_trip.origin_station),
          missing_next_scheduled_departure_time:
            ignore_next_trip || (next_trip && next_trip.scheduled_departure),
          missing_next_arrival_station:
            ignore_next_trip || (next_trip && next_trip.destination_station),
          missing_next_scheduled_arrival_time:
            ignore_next_trip || (next_trip && next_trip.scheduled_arrival)
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

  @spec populate_actual_departures([Vehicle.t()], DateTime.t()) :: [Vehicle.t()]
  def populate_actual_departures(vehicles, now) do
    service_date = Util.Time.service_date_for_utc_datetime(now)

    search_cutoff = DateTime.add(now, @event_search_cutoff_m, :minute)

    # Get all of the `origin_station`s from all of the current matched ocs trips,
    #  no matter what they are
    search_stations =
      vehicles
      |> Enum.map(
        &Stations.ocs_to_gtfs(&1.ocs_trips.current && &1.ocs_trips.current.origin_station)
      )
      |> Enum.uniq()

    # Get relevant events from the database
    events =
      Repo.all(
        from(event in VehicleEvent,
          where:
            event.service_date == ^service_date and event.arrival_departure == :departure and
              event.station_id in ^search_stations and event.timestamp > ^search_cutoff,
          group_by: [event.vehicle_id, event.station_id],
          select: %{
            vehicle_id: event.vehicle_id,
            station_id: event.station_id,
            timestamp: max(event.timestamp)
          }
        )
      )
      # NB pm: Should be possible for Repo.all to return a map, I think?
      # But I couldn't quickly figure it out, hence the group_by above followed by this
      |> Enum.into(%{}, &{{&1.vehicle_id, &1.station_id}, &1.timestamp})

    Enum.map(vehicles, fn vehicle ->
      %{ocs_trips: %{current: current}} = vehicle

      if current != nil and !at_scheduled_origin(vehicle) do
        origin_station = Stations.ocs_to_gtfs(current.origin_station)
        actual_departure = Map.get(events, {current.train_uid, origin_station})

        vehicle = put_in(vehicle.ocs_trips.current.departed, true)
        put_in(vehicle.ocs_trips.current.actual_departure, actual_departure)
      else
        vehicle
      end
    end)
  end

  @spec at_scheduled_origin(Vehicle.t()) :: boolean()
  defp at_scheduled_origin(vehicle) do
    # NB pm: Ashmont exception
    #   Vehicles turning around south of Ashmont are IN_TRANSIT_TO Ashmont, but for the purposes of
    #   determining whether we should show an Actual Departure, they are stopped there.
    stopped =
      vehicle.position.current_status == :STOPPED_AT or
        (vehicle.position.station_id == "place-asmnl" and vehicle.position.direction == 1)

    # Check if stopped at the OCS origin_station
    stopped and
      vehicle.position.station_id ==
        Stations.ocs_to_gtfs(vehicle.ocs_trips.current.origin_station)
  end
end
