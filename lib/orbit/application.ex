defmodule Orbit.Application do
  use Application

  @impl true
  def start(_type, _args) do
    Orbit.Sentry.add_logger_handler!()
    Orbit.Telemetry.setup_telemetry()

    children =
      [
        OrbitWeb.Telemetry,
        Orbit.Repo,
        {Ecto.Migrator, repos: Application.fetch_env!(:orbit, :ecto_repos)},
        {Oban, Application.fetch_env!(:orbit, Oban)},
        {Phoenix.PubSub, name: Orbit.PubSub},
        # Start a worker by calling: Orbit.Worker.start_link(arg)
        # {Orbit.Worker, arg},
        # Start to serve requests, typically the last entry
        OrbitWeb.Endpoint
      ] ++
        if Application.get_env(:orbit, :poll_rtr?) do
          [
            %{
              id: :vehicle_positions,
              start:
                {Realtime.PollingServer, :start_link,
                 [
                   %Realtime.PollingServer.Opts{
                     server_name: :vehicle_positions,
                     entity_type: :vehicle_positions,
                     s3_ref: :rtr_public,
                     s3_path: "rtr/VehiclePositions_enhanced.json",
                     poll_delay: Application.get_env(:orbit, :rtr_poll_delay),
                     decode_fn: &Realtime.RTR.parse_vehicle_positions/1
                   }
                 ]}
            },
            %{
              id: :trip_updates,
              start:
                {Realtime.PollingServer, :start_link,
                 [
                   %Realtime.PollingServer.Opts{
                     server_name: :trip_updates,
                     entity_type: :trip_updates,
                     s3_ref: :rtr_public,
                     s3_path: "rtr/TripUpdates_enhanced.json",
                     poll_delay: Application.get_env(:orbit, :rtr_poll_delay),
                     decode_fn: &Realtime.RTR.parse_trip_updates/1
                   }
                 ]}
            },
            Realtime.TripMatcherServer
          ]
        else
          []
        end

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
