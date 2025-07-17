defmodule Realtime.VehicleEventDetector do
  @moduledoc """
  Watches for trains entering and exiting stations
  and stores them in the vehicle_events table
  """

  use GenServer
  alias Orbit.RailLine
  alias Orbit.Repo
  alias Realtime.Data.Stations
  alias Realtime.Data.VehicleEvent
  alias Realtime.Data.VehiclePosition

  @type vehicle_positions_with_timestamp :: %{
          timestamp: Util.Time.timestamp(),
          entities: [Realtime.Data.VehiclePosition.t()]
        }

  @type state :: %{
          last_vehicle_positions: vehicle_positions_with_timestamp,
          subscriptions: MapSet.t(pid())
        }

  @terminals [
    {"place-alfcl", 0},
    {"place-asmnl", 1},
    {"place-brntn", 1}
  ]

  defmodule StationEvent do
    @moduledoc """
    Describes all the ways to enter or exit a station.
    A subset of VehicleEvent
    """

    @type t :: %__MODULE__{
            station_id: String.t(),
            direction: integer(),
            arrival_departure: :arrival | :departure
          }

    @enforce_keys [
      :station_id,
      :direction,
      :arrival_departure
    ]
    defstruct [
      :station_id,
      :direction,
      :arrival_departure
    ]

    @spec new(String.t(), integer(), :arrival | :departure) :: t
    def new(station_id, direction, arrival_departure) do
      %StationEvent{
        station_id: station_id,
        direction: direction,
        arrival_departure: arrival_departure
      }
    end
  end

  # Client functions

  @spec start_link(any()) :: GenServer.on_start()
  def start_link(_opts) do
    GenServer.start_link(__MODULE__, nil, name: __MODULE__)
  end

  @spec subscribe(pid()) :: :ok
  def subscribe(pid) do
    GenServer.call(__MODULE__, {:subscribe, pid})
  end

  # GenServer callbacks

  @impl true
  def init(_args) do
    current_vehicle_positions =
      Realtime.PollingServer.subscribe(self(), :vehicle_positions)

    {:ok,
     %{
       last_vehicle_positions: current_vehicle_positions,
       subscriptions: MapSet.new()
     }}
  end

  @impl true
  def handle_info({:new_data, :vehicle_positions, new_vehicle_positions}, state) do
    new_state = %{state | last_vehicle_positions: new_vehicle_positions}

    new_events =
      new_vehicle_events(
        state.last_vehicle_positions,
        new_vehicle_positions,
        Util.Time.current_service_date()
      )

    if new_events != [] do
      Enum.each(state.subscriptions, fn pid ->
        send(pid, {:new_data, :vehicle_events, new_events})
      end)

      new_events
      |> Enum.map(&VehicleEvent.changeset/1)
      |> Enum.each(&Repo.insert(&1, log: false))
    end

    {:noreply, new_state}
  end

  def handle_info({:DOWN, _monitor_ref, :process, pid, _reason}, state) do
    {:noreply, %{state | subscriptions: MapSet.delete(state.subscriptions, pid)}}
  end

  @impl true
  def handle_call({:subscribe, pid}, _from, state) do
    Process.monitor(pid)
    {:reply, :ok, %{state | subscriptions: MapSet.put(state.subscriptions, pid)}}
  end

  @spec new_vehicle_events(
          vehicle_positions_with_timestamp,
          vehicle_positions_with_timestamp,
          Date.t()
        ) :: [VehicleEvent.t()]
  def new_vehicle_events(%{timestamp: 0, entities: []}, _new_vehicle_positions, _service_date) do
    # Don't look for changes the first time we get real data
    []
  end

  def new_vehicle_events(old_vehicle_positions, new_vehicle_positions, service_date) do
    # list of {old_vp | nil, new_vp | nil} pairs
    Util.List.zip_by(old_vehicle_positions.entities, new_vehicle_positions.entities, fn vp ->
      MapSet.new(vp.cars)
    end)
    |> Enum.flat_map(&vehicle_events_for_one_train(&1, service_date))
  end

  @spec vehicle_events_for_one_train({VehiclePosition.t(), VehiclePosition.t()}, Date.t()) :: [
          StationEvent.t()
        ]
  defp vehicle_events_for_one_train({old_vp, new_vp}, service_date) do
    station_events = station_events_for_one_train({old_vp, new_vp})

    Enum.map(station_events, fn station_event ->
      %VehicleEvent{
        service_date: service_date,
        cars: new_vp.cars,
        station_id: station_event.station_id,
        vehicle_id: new_vp.vehicle_id,
        rail_line: RailLine.from_route_id(new_vp.route_id),
        direction_id: station_event.direction,
        arrival_departure: station_event.arrival_departure,
        timestamp: new_vp.timestamp
      }
    end)
  end

  @doc """
  In order to reduce duplication among the dozens of different cases for how a train might move,
  This uses StationEvent to only return the information that's different in each case.
  The rest of the fields, like cars, are filled in later to make a full VehicleEvent.
  """
  @spec station_events_for_one_train({VehiclePosition.t() | nil, VehiclePosition.t() | nil}) :: [
          StationEvent.t()
        ]
  def station_events_for_one_train({
        %VehiclePosition{} = _old_vp,
        nil
      }) do
    # Train disappeared
    []
  end

  def station_events_for_one_train({
        nil,
        %VehiclePosition{} = new_vp
      }) do
    # New train appeared
    # If a train appears while still at a terminal, we'll record the departure later when it leaves
    # If a train appears far from a terminal, we don't know how to reconstruct its history
    # In both of those cases, we don't want to record any events.
    # But sometimes trains won't appear until just after leaving their pullout location
    # In that case, we can record their recent departure from the pullout.
    Enum.flat_map(@terminals, fn {pullout, departure_direction} ->
      if departure_direction != nil && new_vp.direction == departure_direction &&
           new_vp.station_id in Stations.next_stations(pullout, departure_direction) do
        case new_vp.current_status do
          :STOPPED_AT ->
            # The train wasn't registered until it made it to the next station.
            [
              StationEvent.new(pullout, departure_direction, :departure),
              StationEvent.new(new_vp.station_id, departure_direction, :arrival)
            ]

          _ ->
            # Noticed before the train got to the next station
            [
              StationEvent.new(pullout, departure_direction, :departure)
            ]
        end
      else
        []
      end
    end)
  end

  def station_events_for_one_train({
        %VehiclePosition{direction: old_direction} = old_vp,
        %VehiclePosition{direction: new_direction} = new_vp
      })
      when old_direction == new_direction do
    # Train is still travelling in the same direction
    direction = new_vp.direction

    cond do
      new_vp.station_id == old_vp.station_id ->
        station = new_vp.station_id

        case {old_vp.current_status, new_vp.current_status} do
          {:STOPPED_AT, :STOPPED_AT} ->
            # Still stopped in station. No movement
            []

          {:STOPPED_AT, _} ->
            # Moved backwards out of a station?
            []

          {_, :STOPPED_AT} ->
            # Entered a station
            [
              StationEvent.new(station, direction, :arrival)
            ]

          {_, _} ->
            # Moved but didn't reach the station yet.
            []
        end

      new_vp.station_id in Stations.next_stations(old_vp.station_id, direction) ->
        case {old_vp.current_status, new_vp.current_status} do
          {:STOPPED_AT, :STOPPED_AT} ->
            # Jumped from one station to the next in one step
            [
              StationEvent.new(old_vp.station_id, direction, :departure),
              StationEvent.new(new_vp.station_id, direction, :arrival)
            ]

          {:STOPPED_AT, _} ->
            # Left the first station, now on its way to the next
            [
              StationEvent.new(old_vp.station_id, direction, :departure)
            ]

          {_, :STOPPED_AT} ->
            # Jumped into, out of, and into the next station
            [
              StationEvent.new(old_vp.station_id, direction, :arrival),
              StationEvent.new(old_vp.station_id, direction, :departure),
              StationEvent.new(new_vp.station_id, direction, :arrival)
            ]

          {_, _} ->
            # Jumped over a station
            [
              StationEvent.new(old_vp.station_id, direction, :arrival),
              StationEvent.new(old_vp.station_id, direction, :departure)
            ]
        end

      true ->
        # Jumped to a far away station. Probably a data problem.
        []
    end
  end

  def station_events_for_one_train({
        %VehiclePosition{direction: old_direction} = old_vp,
        %VehiclePosition{direction: new_direction} = new_vp
      })
      when old_direction != new_direction do
    # Train turned around
    cond do
      new_vp.station_id == old_vp.station_id ->
        case {old_vp.current_status, new_vp.current_status} do
          {:STOPPED_AT, :STOPPED_AT} ->
            # Turned around in the station.
            []

          {:STOPPED_AT, _} ->
            # Left the station, then turned around before reaching the next.
            [
              StationEvent.new(old_vp.station_id, old_vp.direction, :departure)
            ]

          {_, :STOPPED_AT} ->
            # Entered the station, then turned around.
            [
              StationEvent.new(old_vp.station_id, old_vp.direction, :arrival)
            ]

          {_, _} ->
            # Jumped over the station, then turned around
            [
              StationEvent.new(old_vp.station_id, old_vp.direction, :arrival),
              StationEvent.new(old_vp.station_id, old_vp.direction, :departure)
            ]
        end

      new_vp.station_id in Stations.next_stations(old_vp.station_id, old_vp.direction) ->
        # Went forward before turning around
        case {old_vp.current_status, new_vp.current_status} do
          {:STOPPED_AT, :STOPPED_AT} ->
            # Jumped from one station to the next, then turned around
            [
              StationEvent.new(old_vp.station_id, old_vp.direction, :departure),
              StationEvent.new(new_vp.station_id, old_vp.direction, :arrival)
            ]

          {:STOPPED_AT, _} ->
            # Jumped out of a station, into the next, then past it, then turned around
            [
              StationEvent.new(old_vp.station_id, old_vp.direction, :departure),
              StationEvent.new(new_vp.station_id, old_vp.direction, :arrival),
              StationEvent.new(new_vp.station_id, old_vp.direction, :departure)
            ]

          {_, :STOPPED_AT} ->
            # Jumped through a station, into the next, then turned around
            [
              StationEvent.new(old_vp.station_id, old_vp.direction, :arrival),
              StationEvent.new(old_vp.station_id, old_vp.direction, :departure),
              StationEvent.new(new_vp.station_id, old_vp.direction, :arrival)
            ]

          {_, _} ->
            # Jumped through both stations, then turned around
            [
              StationEvent.new(old_vp.station_id, old_vp.direction, :arrival),
              StationEvent.new(old_vp.station_id, old_vp.direction, :departure),
              StationEvent.new(new_vp.station_id, old_vp.direction, :arrival),
              StationEvent.new(new_vp.station_id, old_vp.direction, :departure)
            ]
        end

      new_vp.station_id in Stations.next_stations(old_vp.station_id, new_vp.direction) ->
        # Turned around, then moved.
        case {old_vp.current_status, new_vp.current_status} do
          {:STOPPED_AT, :STOPPED_AT} ->
            # Turned around, then jumped into the next station
            [
              StationEvent.new(old_vp.station_id, new_vp.direction, :departure),
              StationEvent.new(new_vp.station_id, new_vp.direction, :arrival)
            ]

          {:STOPPED_AT, _} ->
            # Turned around, then left the station, now on its way to the next.
            [
              StationEvent.new(old_vp.station_id, new_vp.direction, :departure)
            ]

          {_, :STOPPED_AT} ->
            # Turned around between stations, then entered the next station in the new direction
            [
              StationEvent.new(new_vp.station_id, new_vp.direction, :arrival)
            ]

          {_, _} ->
            # Turned around, but hasn't reached the next station yet.
            []
        end

      true ->
        # Jumped to a far away station. Probably a data problem.
        []
    end
  end
end
