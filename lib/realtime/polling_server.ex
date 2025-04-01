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
            poll_delay: integer()
          }
    @enforce_keys [
      :server_name,
      :entity_type,
      :s3_ref,
      :s3_path,
      :poll_delay
    ]
    defstruct [
      :server_name,
      :entity_type,
      :s3_ref,
      :s3_path,
      :poll_delay
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
          cached_data: realtime_info(t)
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
       cached_data: %{timestamp: 0, entities: []}
     }}
  end

  @impl true
  def handle_info(:poll, state) do
    server = self()

    Task.start_link(fn ->
      try do
        log_level_ok = if Application.get_env(:glides, :log_polls?, true), do: :info, else: nil

        Logger.info("------- reading from s3 bucket -------")
        response = Orbit.S3.read(state.s3_ref, state.s3_path, log_level_ok: log_level_ok)
      after
        Process.send_after(server, :poll, state.poll_delay)
      end
    end)

    Logger.info("updating state")
    {:noreply, state}
  end
end
