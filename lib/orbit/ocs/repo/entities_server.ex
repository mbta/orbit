defmodule Orbit.Ocs.EntitiesServer do
  require Logger

  use GenServer

  alias Orbit.Ocs.Message
  alias Orbit.Ocs.UidCache

  @throttle_seconds 5

  @typep output :: %{timestamp: integer(), entities: Orbit.Ocs.Entities.entities()}
  @typep state :: %{
           trip_uid_cache: map(),
           out: output(),
           subscriptions: MapSet.t(pid()),
           last_push_to_subscriptions: DateTime.t()
         }

  @spec start_link(any()) :: GenServer.on_start()
  def start_link(opts) do
    GenServer.start_link(__MODULE__, opts, name: {:global, __MODULE__})
  end

  @impl GenServer
  def init(opts) do
    Logger.info("#{__MODULE__} initialize pid=#{inspect(self())}")

    # Configurable for tests
    if Keyword.get(opts, :schedule_pushes?, true) do
      schedule()
    end

    today = Util.Time.current_service_date()
    trip_uid_cache = UidCache.initialize(today)
    Logger.info("trip_uid_cache initialized size is #{map_size(trip_uid_cache)}")

    {:ok,
     %{
       trip_uid_cache: trip_uid_cache,
       out: %{timestamp: Util.Time.current_time(), entities: Orbit.Ocs.Entities.query_latest()},
       subscriptions: MapSet.new(),
       last_push_to_subscriptions: DateTime.utc_now()
     }}
  end

  @impl GenServer
  @spec handle_call({:subscribe, pid()}, GenServer.from(), state()) ::
          {:reply, output(), state()}
  def handle_call({:subscribe, pid}, _from, state) do
    Process.monitor(pid)

    {:reply, self(), %{state | subscriptions: MapSet.put(state.subscriptions, pid)}}
  end

  @impl GenServer
  @spec handle_call(
          {:new_messages, [Message.t()]},
          GenServer.from(),
          state()
        ) ::
          {:reply, :ok, state()}
  def handle_call({:new_messages, messages}, _from, state) do
    apply_changes(messages, state.trip_uid_cache)

    # TODO: Avoid synchronous push here?
    state = push_with_throttling(state)

    {:reply, :ok, state}
  end

  defp schedule do
    Process.send_after(self(), :ensure_push, 1_000)
  end

  @impl GenServer
  def handle_info(:ensure_push, state) do
    state = push_with_throttling(state)
    schedule()
    {:noreply, state}
  end

  @impl GenServer
  @spec handle_info({:DOWN, reference(), :process, pid(), term()}, state()) :: {:noreply, state()}
  def handle_info({:DOWN, _monitor_ref, :process, pid, _reason}, state) do
    {:noreply, %{state | subscriptions: MapSet.delete(state.subscriptions, pid)}}
  end

  # Subscribe

  @spec subscribe(pid(), atom()) :: pid()
  def subscribe(subscriber_pid, server_name \\ __MODULE__) do
    GenServer.call({:global, server_name}, {:subscribe, subscriber_pid})
  end

  # Push

  @spec push_with_throttling(state()) :: state()
  defp push_with_throttling(state) do
    time_since_last_push =
      DateTime.diff(DateTime.utc_now(), state.last_push_to_subscriptions, :second)

    if time_since_last_push < @throttle_seconds do
      Logger.debug("#{__MODULE__} push_throttled time_since_last_push_s=#{time_since_last_push}")
      state
    else
      push(state)
    end
  end

  @spec push(state()) :: state()
  defp push(state) do
    entities = Orbit.Ocs.Entities.query_latest()
    now = Util.Time.current_time()
    service_date = Util.Time.service_date_for_timestamp(now)

    state = %{
      state
      | out: %{
          timestamp: now,
          entities: entities
        },
        trip_uid_cache: Orbit.Ocs.UidCache.prune(state.trip_uid_cache, service_date)
    }

    Logger.info(
      "#{__MODULE__} push_to_all_subscribers pids=#{state.subscriptions |> Enum.map_join(",", &inspect(&1))}"
    )

    Enum.each(state.subscriptions, fn pid ->
      send(pid, {:new_data, :ocs_trips, state.out})
    end)

    %{state | last_push_to_subscriptions: DateTime.utc_now()}
  end

  # Message Processing

  @spec new_messages(atom() | {:global, atom()}, [Message.t()]) :: :ok
  def new_messages(pid \\ {:global, __MODULE__}, messages) do
    GenServer.call(pid, {:new_messages, messages}, 10_000)
  end

  @spec apply_changes([Orbit.Ocs.Message.t()], map()) :: :ok | :error
  defp apply_changes(messages, trip_uid_cache) do
    Enum.each(messages, fn message ->
      apply_changes_for_message(message, trip_uid_cache)
    end)
  end

  @spec apply_changes_for_message(Orbit.Ocs.Message.t(), map()) :: :ok | :error
  defp apply_changes_for_message(message, trip_uid_cache) do
    results = Orbit.Ocs.Entities.apply_changes(message, trip_uid_cache)

    errors =
      Enum.filter(results, fn result ->
        case result do
          {:error, _} -> true
          _ -> false
        end
      end)

    Enum.each(errors, fn {:error, e} ->
      Logger.warning("database error: #{inspect(e)}")
    end)

    if errors == [], do: :ok, else: :error
  end
end
