defmodule Realtime.VehicleEventWriter do
  @moduledoc """
  Watches for trains entering and exiting stations
  and stores them in the vehicle_events table
  """

  require Logger
  alias Orbit.Repo
  alias Realtime.Data.VehicleEvent
  alias Realtime.VehicleEventDetector

  use GenServer

  @type state :: %{
          last_vehicle_positions: VehicleEventDetector.vehicle_positions_with_timestamp(),
          subscriptions: MapSet.t(pid())
        }

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

    service_date = Util.Time.service_date_for_timestamp(new_vehicle_positions.timestamp)

    new_events =
      VehicleEventDetector.new_vehicle_events(
        state.last_vehicle_positions,
        new_vehicle_positions,
        service_date
      )

    if new_events != [] do
      Enum.each(state.subscriptions, fn pid ->
        send(pid, {:new_data, :vehicle_events, new_events})
      end)

      if Orbit.Oban.leader?() do
        new_events
        |> Enum.map(&VehicleEvent.changeset/1)
        |> Enum.each(&Repo.insert(&1, log: false))

        Enum.each(new_events, &log_new_event/1)
      end
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

  # Exposed for testing
  def log_new_event(vehicle_event) do
    Logger.info(
      "vehicle_event_detector new_event service_date=#{vehicle_event.service_date} cars=#{VehicleEventDetector.consist_as_string(vehicle_event)} station_id=#{vehicle_event.station_id} vehicle_id=#{vehicle_event.vehicle_id} direction_id=#{vehicle_event.direction_id} rail_line=#{vehicle_event.rail_line} arrival_departure=#{vehicle_event.arrival_departure}"
    )
  end
end
