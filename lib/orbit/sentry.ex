defmodule Orbit.Sentry do
  @doc """
  hook into :logger to capture exceptions from crashed processes
  run during application startup
  https://hexdocs.pm/sentry/Sentry.LoggerHandler.html#module-usage
  """
  def add_logger_handler do
    :logger.add_handler(:orbit_sentry_handler, Sentry.LoggerHandler, %{
      config: %{metadata: [:file, :line]}
    })
  end
end
