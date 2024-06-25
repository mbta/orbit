defmodule Orbit.Application do
  use Application

  @impl true
  def start(_type, _args) do
    Orbit.Sentry.add_logger_handler!()

    children = [
      OrbitWeb.Telemetry,
      Orbit.Repo,
      {Ecto.Migrator, repos: Application.fetch_env!(:orbit, :ecto_repos)},
      {Oban, Application.fetch_env!(:orbit, Oban)},
      {Phoenix.PubSub, name: Orbit.PubSub},
      # Start a worker by calling: Orbit.Worker.start_link(arg)
      # {Orbit.Worker, arg},
      # Start to serve requests, typically the last entry
      OrbitWeb.Endpoint
    ]

    :ok = Logster.attach_phoenix_logger()

    Supervisor.start_link(children, strategy: :one_for_one, name: Orbit.Supervisor)
  end

  # Tell Phoenix to update the endpoint configuration
  # whenever the application is updated.
  @impl true
  def config_change(changed, _new, removed) do
    OrbitWeb.Endpoint.config_change(changed, removed)
    :ok
  end
end
