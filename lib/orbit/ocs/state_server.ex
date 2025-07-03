defmodule Orbit.Ocs.StateServer do
  require Logger

  use GenServer

  alias Orbit.Ocs.SplunkFormatter
  alias Orbit.Ocs.Trip

  @expired_seconds 86_400
  @max_process_time 66_000

  @typep entities :: [Trip.t()]
  @typep output :: %{entities: entities()}
  @typep state :: %{
           in: %{
             last_message_timestamp: DateTime.t()
           },
           out: output(),
           subscriptions: MapSet.t(pid()),
           last_push_to_subscriptions: DateTime.t()
         }

  @spec start_link(any()) :: GenServer.on_start()
  def start_link(_opts) do
    GenServer.start_link(__MODULE__, nil, name: __MODULE__)
  end

  @impl GenServer
  def init(_opts) do
    Logger.info("Initialized Ocs.StateServer")

    schedule()

    now = DateTime.utc_now()

    {:ok,
     %{
       in: %{last_message_timestamp: now},
       out: %{entities: fetch_entities()},
       subscriptions: MapSet.new(),
       last_push_to_subscriptions: now
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
          {:new_messages, [String.t()], DateTime.t()},
          GenServer.from(),
          state()
        ) ::
          {:reply, :ok, state()}
  def handle_call({:new_messages, messages, current_time}, _from, state) do
    process_messages(messages, current_time)

    # TODO: Avoid synchronous push here?
    state =
      state
      |> put_in([:in, :last_message_timestamp], current_time)
      |> push_with_throttling()

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

  # Subscribe

  @spec subscribe(pid(), atom()) :: output()
  def subscribe(subscriber_pid, server_name \\ __MODULE__) do
    GenServer.call(server_name, {:subscribe, subscriber_pid})
  end

  # Push

  @push_throttle_time_s 5

  @spec push_with_throttling(state()) :: state()
  defp push_with_throttling(state) do
    # If we have new messages processed
    # If our push is not throttled
    now = DateTime.utc_now()

    cond do
      DateTime.compare(state.in.last_message_timestamp, state.last_push_to_subscriptions) != :gt ->
        Logger.debug("#{__MODULE__} : No new data to push")
        state

      (time_since_last_push = DateTime.diff(now, state.last_push_to_subscriptions, :second)) <=
          @push_throttle_time_s ->
        Logger.debug("#{__MODULE__} : Push throttled (#{time_since_last_push}s since last push)")
        state

      true ->
        push(state)
    end
  end

  @spec push(state()) :: state()
  defp push(state) do
    entities = fetch_entities()

    state = put_in(state, [:out, :entities], entities)

    Logger.info("#{__MODULE__} : Pushing to all subscribers)")

    Enum.each(state.subscriptions, fn pid ->
      send(pid, {:new_data, :ocs_entities, entities})
    end)

    %{state | last_push_to_subscriptions: DateTime.utc_now()}
  end

  # Querying

  @spec fetch_entities() :: [Trip.t()]
  defp fetch_entities do
    # TODO: Fetch trips from database
    []
  end

  # Message Processing

  @spec new_messages(atom(), [String.t()], DateTime.t()) :: :ok
  def new_messages(pid \\ __MODULE__, messages, current_time) do
    GenServer.call(pid, {:new_messages, messages, current_time}, 10_000)
  end

  @spec process_messages(
          messages :: [String.t()],
          current_time :: DateTime.t()
        ) :: :ok
  defp process_messages(messages, current_time) do
    Enum.each(messages, fn message -> process_raw(message, current_time) end)
    :ok
  end

  @spec process_raw(String.t(), DateTime.t()) :: {:ok | :error, any}
  defp process_raw(line, current_time) do
    # TODO: Health monitoring?
    Logger.info("raw_ocs_message #{line}")

    case Orbit.Ocs.Parser.parse(line, current_time) do
      {:ok, %{transitline: transitline} = message} when transitline in ["R", "O", "B"] ->
        process_parsed(message, current_time)

      {:ok, _other} ->
        {:ok, :ignored}

      {:error, e} ->
        Logger.warning(
          "event=ocs_message_parse_issue Issue with line #{line} : #{Exception.format(:error, e)}"
        )

        {:error, e}
    end
  end

  @spec process_parsed(Orbit.Ocs.Message.t(), DateTime.t()) :: {:ok | :error, any}
  defp process_parsed(message, current_time) do
    Logger.info(SplunkFormatter.format(message))

    if expired?(message, current_time) do
      log_expired_message(message)

      {:error, "expired message"}
    else
      {time, val} = :timer.tc(fn -> apply_changes(message, current_time) end)
      log_slow_message_handling(time, @max_process_time, message)
      val
    end
  end

  @spec expired?(Orbit.Ocs.Message.t(), DateTime.t()) :: boolean
  def expired?(%{timestamp: timestamp}, current_time) do
    Timex.Comparable.diff(current_time, timestamp, :seconds) > @expired_seconds
  end

  def expired?(_message, _current_time) do
    false
  end

  @spec log_expired_message(Orbit.Ocs.Message.t()) :: :ok
  defp log_expired_message(message) do
    Logger.warning(
      "event=ocs_message_expired Message #{inspect(message)} was expired at the time we tried to process it"
    )
  end

  @spec log_slow_message_handling(integer, integer, Orbit.Ocs.Message.t()) ::
          :ok | {:error, String.t()}
  def log_slow_message_handling(time_in_microseconds, max_time, message)
      when time_in_microseconds > max_time do
    Logger.info("Message #{inspect(message)} took #{time_in_microseconds / 1000} ms to process")
  end

  def log_slow_message_handling(_time, _max_time, _message), do: :ok

  @spec apply_changes(Orbit.Ocs.Message.t(), DateTime.t()) :: :ok | :error
  defp apply_changes(message, _current_time) do
    results = Orbit.Ocs.ChangeSet.apply_changes(message)

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
