defmodule Orbit.Telemetry do
  require Logger

  @spec setup_telemetry :: :ok
  def setup_telemetry do
    :telemetry.attach_many(
      "oban",
      [[:oban, :job, :stop], [:oban, :job, :exception]],
      &Orbit.Telemetry.log/4,
      []
    )

    :telemetry.detach({Phoenix.Logger, [:phoenix, :socket_connected]})
    :telemetry.detach({Phoenix.Logger, [:phoenix, :channel_joined]})

    :telemetry.attach_many(
      "orbit-socket",
      [
        [:phoenix, :socket_connected],
        [:phoenix, :channel_joined],
        [:phoenix, :channel_handled_in]
      ],
      &Orbit.Telemetry.log/4,
      []
    )

    :ok
  end

  # telemetry prefers this function to be public
  def log(event_name, measure, meta, config)

  def log([:oban, :job, :stop], measure, meta, _config) do
    Logger.info(
      "oban_job_stop #{format_duration(measure.duration)} state=#{meta.state} worker=#{meta.job.worker} result=\"#{inspect(meta[:result] || nil)}\""
    )
  end

  @doc """
  https://hexdocs.pm/oban/Oban.html#module-reporting-errors
  """
  def log([:oban, :job, :exception], measure, meta, _) do
    extra =
      meta.job
      |> Map.take([:id, :args, :meta, :queue, :worker])
      |> Map.merge(measure)

    reason = Exception.normalize(:error, meta.reason, meta.stacktrace)

    Sentry.capture_exception(reason, stacktrace: meta.stacktrace, extra: extra)

    Logger.error(
      "oban_job_exception #{format_duration(measure.duration)} state=#{meta.state} worker=#{meta.job.worker}\n" <>
        Exception.message(reason) <> "\n" <> Exception.format_stacktrace(meta.stacktrace)
    )
  end

  def log([:phoenix, :socket_connected], measure, _meta, _config) do
    Logger.info("socket_connected #{format_duration(measure.duration)}")
  end

  def log([:phoenix, :channel_joined], measure, meta, _config) do
    Logger.info(
      "channel_joined #{format_duration(measure.duration)} email=#{meta.socket.assigns[:email] || nil} channel=#{meta.socket.channel} topic=#{meta.socket.topic}"
    )
  end

  def log([:phoenix, :channel_handled_in], measure, meta, _config) do
    Logger.info(
      "channel_handled_in #{format_duration(measure.duration)} email=#{meta.socket.assigns[:email] || nil} channel=#{meta.socket.channel} topic=#{meta.socket.topic} event=#{meta.event}"
    )
  end

  # nanoseconds integer to milliseconds string
  @spec format_duration(integer()) :: String.t()
  defp format_duration(duration_ns) do
    "duration=#{:erlang.float_to_binary(duration_ns / 1_000_000, decimals: 3)} ms"
  end
end
