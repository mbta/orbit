defmodule Orbit.Ocs.EntitiesServer do
  require Logger

  use GenServer

  alias Orbit.Ocs.Message

  @throttle_seconds 5

  @typep output :: %{timestamp: integer(), entities: Orbit.Ocs.Entities.entities()}
  @typep state :: %{
           out: output(),
           subscriptions: MapSet.t(pid()),
           last_push_to_subscriptions: DateTime.t()
         }

  @spec start_link(any()) :: GenServer.on_start()
  def start_link(opts) do
    GenServer.start_link(__MODULE__, opts, name: __MODULE__)
  end

  @impl GenServer
  def init(opts) do
    Logger.info("Initialized Ocs.EntitiesServer")

    # Configurable for tests
    if Keyword.get(opts, :schedule_pushes?, true) do
      schedule()
    end

    {:ok,
     %{
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

    {:reply, state.out, %{state | subscriptions: MapSet.put(state.subscriptions, pid)}}
  end

  @impl GenServer
  @spec handle_call(
          {:new_messages, [Message.t()]},
          GenServer.from(),
          state()
        ) ::
          {:reply, :ok, state()}
  def handle_call({:new_messages, messages}, _from, state) do
    apply_changes(messages)

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

  @spec subscribe(pid(), atom()) :: output()
  def subscribe(subscriber_pid, server_name \\ __MODULE__) do
    GenServer.call(server_name, {:subscribe, subscriber_pid})
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

    state = %{
      state
      | out: %{
          timestamp: Util.Time.current_time(),
          entities: entities
        }
    }

    Logger.info("#{__MODULE__} : push_to_all_subscribers")

    Enum.each(state.subscriptions, fn pid ->
      send(pid, {:new_data, :ocs_trips, state.out})
    end)

    %{state | last_push_to_subscriptions: DateTime.utc_now()}
  end

  # Message Processing

  @spec new_messages(atom(), [Message.t()]) :: :ok
  def new_messages(pid \\ __MODULE__, messages) do
    GenServer.call(pid, {:new_messages, messages}, 10_000)
  end

  @spec apply_changes([Orbit.Ocs.Message.t()]) :: :ok | :error
  defp apply_changes(messages) do
    Enum.each(messages, &apply_changes_for_message/1)
  end

  @spec apply_changes_for_message(Orbit.Ocs.Message.t()) :: :ok | :error
  defp apply_changes_for_message(message) do
    results = Orbit.Ocs.Entities.apply_changes(message)

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
