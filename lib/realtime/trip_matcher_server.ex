defmodule Realtime.TripMatcherServer do
  use GenServer
  require Logger

  alias Orbit.Ocs.Trip
  alias Orbit.Vehicle
  alias Realtime.Data.TripUpdate
  alias Realtime.Data.VehiclePosition
  alias Realtime.TripMatcher

  @typep state :: %{
           in: %{
             vehicle_positions: %{timestamp: integer(), entities: [VehiclePosition.t()]},
             trip_updates: %{timestamp: integer(), entities: [TripUpdate.t()]},
             ocs_trips: %{timestamp: integer(), entities: [Trip.t()]}
           },
           out: %{timestamp: integer(), entities: [Vehicle.t()]},
           subscriptions: MapSet.t(pid()),
           last_push_to_subscriptions: DateTime.t()
         }

  @spec start_link(any()) :: GenServer.on_start()
  def start_link(_opts) do
    GenServer.start_link(__MODULE__, nil, name: __MODULE__)
  end

  @spec subscribe(pid()) :: [Vehicle.t()]
  def subscribe(pid) do
    GenServer.call(__MODULE__, {:subscribe, pid})
  end

  @impl GenServer
  @spec init(any()) ::
          {:ok, state()}
  def init(_args) do
    Logger.info("Initialized TripMatcherServer")

    Realtime.PollingServer.subscribe(self(), :vehicle_positions)
    Realtime.PollingServer.subscribe(self(), :trip_updates)
    Orbit.Ocs.EntitiesServer.subscribe(self())

    schedule()

    {:ok,
     %{
       in: %{
         vehicle_positions: %{timestamp: 0, entities: []},
         trip_updates: %{timestamp: 0, entities: []},
         ocs_trips: %{timestamp: 0, entities: []}
       },
       out: %{timestamp: 0, entities: []},
       subscriptions: MapSet.new(),
       last_push_to_subscriptions: DateTime.utc_now()
     }}
  end

  @impl GenServer
  @spec handle_call({:subscribe, pid()}, GenServer.from(), state()) ::
          {:reply, %{timestamp: integer(), entities: [Vehicle.t()]}, state()}
  def handle_call({:subscribe, pid}, _from, state) do
    Process.monitor(pid)

    {:reply, state.out, %{state | subscriptions: MapSet.put(state.subscriptions, pid)}}
  end

  defp schedule do
    Process.send_after(self(), {:ensure_push, 5}, 1_000)
  end

  @impl GenServer
  @spec handle_info({:ensure_push, integer()}, state()) :: :ok
  def handle_info({:ensure_push, interval_s}, state) do
    state =
      if DateTime.diff(DateTime.utc_now(), state.last_push_to_subscriptions, :second) >=
           interval_s do
        Logger.error(
          "TripMatcherServer VehiclePositions didn't come fast enough; force sending to subscriptions"
        )

        push_new_data(state)
      else
        state
      end

    schedule()
    {:noreply, state}
  end

  @impl GenServer
  @spec handle_info({:new_data, atom(), any()}, state()) :: {:noreply, state()}
  def handle_info({:new_data, type, data}, state) do
    state = put_in(state, [:in, type], data)

    now = DateTime.to_unix(DateTime.utc_now())

    Logger.info(
      "TripMatcherServer data_age " <>
        "vehicle_positions_s=#{now - state.in.vehicle_positions.timestamp} " <>
        "trip_updates_s=#{now - state.in.trip_updates.timestamp} " <>
        "ocs_trips_s=#{now - state.in.ocs_trips.timestamp} "
    )

    new_vehicles =
      TripMatcher.match_trips(
        state.in.vehicle_positions.entities,
        state.in.trip_updates.entities,
        state.in.ocs_trips.entities
      )

    # We use the vehicle position timestamp as the overall timestamp, as that's
    # the most clear indicator of data age
    new_timestamp = state.in.vehicle_positions.timestamp

    state = Map.put(state, :out, %{timestamp: new_timestamp, entities: new_vehicles})

    state =
      if type == :vehicle_positions do
        push_new_data(state)
      else
        state
      end

    {:noreply, state}
  end

  @impl GenServer
  @spec handle_info({:DOWN, reference(), :process, pid(), term()}, state()) :: {:noreply, state()}
  def handle_info({:DOWN, _monitor_ref, :process, pid, _reason}, state) do
    {:noreply, %{state | subscriptions: MapSet.delete(state.subscriptions, pid)}}
  end

  defp push_new_data(state) do
    Enum.each(state.subscriptions, fn pid ->
      send(pid, {:new_data, :vehicles, state.out})
    end)

    Map.put(state, :last_push_to_subscriptions, DateTime.utc_now())
  end
end
