defmodule Realtime.PollingServer do
  @moduledoc """
  Fetches live data from RTR, and forwards it to connected clients.
  """
  use GenServer

  require Logger

  defmodule Opts do
    @type t :: %__MODULE__{
            server_name: atom(),
            entity_type: atom(),
            s3_ref: Orbit.S3.s3_ref(),
            s3_path: String.t(),
            poll_delay: integer(),
            decode_fn: (binary() -> Realtime.PollingServer.realtime_info(term()) | nil)
          }
    @enforce_keys [
      :server_name,
      :entity_type,
      :s3_ref,
      :s3_path,
      :poll_delay,
      :decode_fn
    ]
    defstruct [
      :server_name,
      :entity_type,
      :s3_ref,
      :s3_path,
      :poll_delay,
      :decode_fn
    ]
  end

  @type realtime_info(t) :: %{
          timestamp: Util.Time.timestamp(),
          entities: [t]
        }

  @type state(t) :: %{
          server_name: atom(),
          entity_type: atom(),
          s3_ref: Orbit.S3.s3_ref(),
          s3_path: String.t(),
          poll_delay: integer(),
          subscriptions: MapSet.t(pid()),
          cached_data: realtime_info(t),
          decode_fn: (binary() -> realtime_info(t) | nil)
        }

  # Client functions

  # starts GenServer and calls init()
  @spec start_link(Opts.t()) :: GenServer.on_start()
  def start_link(opts) do
    {:ok, pid} = GenServer.start_link(__MODULE__, opts, name: opts.server_name)
    send(pid, :poll)
    {:ok, pid}
  end

  # GenServer callbacks

  @impl true
  def init(opts) do
    {:ok,
     %{
       server_name: opts.server_name,
       entity_type: opts.entity_type,
       s3_ref: opts.s3_ref,
       s3_path: opts.s3_path,
       poll_delay: opts.poll_delay,
       subscriptions: MapSet.new(),
       cached_data: %{timestamp: 0, entities: []},
       decode_fn: opts.decode_fn
     }}
  end

  @impl true
  def handle_info(:poll, state) do
    server = self()

    Task.start_link(fn ->
      try do
        log_level_ok = if Application.get_env(:glides, :log_polls?, true), do: :info, else: nil
        response = Orbit.S3.read(state.s3_ref, state.s3_path, log_level_ok: log_level_ok)
        send(server, {:got_poll, response})
      after
        Process.send_after(server, :poll, state.poll_delay)
      end
    end)

    {:noreply, state}
  end

  @impl true
  def handle_info({:got_poll, response}, state) do
    new_state =
      with {:ok, binary_data} <- response,
           data when not is_nil(data) <- state.decode_fn.(binary_data) do
        old_timestamp = state.cached_data.timestamp
        new_timestamp = data.timestamp

        if old_timestamp != new_timestamp do
          log_level = if Application.get_env(:orbit, :log_polls?, true), do: :info, else: nil

          if log_level do
            Logger.log(
              log_level,
              "poll_new_data source=#{state.server_name} timestamp=#{data.timestamp} count=#{length(data.entities)}"
            )
          end

          Enum.each(state.subscriptions, fn pid ->
            send(pid, {:new_data, state.entity_type, data})
          end)
        end

        %{state | cached_data: data}
      else
        response ->
          Logger.warning(fn ->
            "polling server source=#{state.server_name} got unexpected response from s3_ref=#{state.s3_ref} path=#{state.s3_path} : #{inspect(response)}"
          end)

          state
      end

    {:noreply, new_state}
  end
end
