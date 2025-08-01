import Config

# Application config
config :orbit,
  appcues_enabled?: false,
  allow_test_data?: false,
  ecto_repos: [Orbit.Repo],
  generators: [timestamp_type: :utc_datetime],
  force_https?: true,
  timezone: "America/New_York",
  poll_rtr?: true,
  rtr_poll_delay: 3_000,
  subscribe_to_ocs?: true

# Kinesis
config :orbit, Orbit.Ocs.Stream.Producer, enabled?: false

# Endpoint config
config :orbit, OrbitWeb.Endpoint,
  url: [host: "localhost"],
  adapter: Bandit.PhoenixAdapter,
  render_errors: [
    formats: [html: OrbitWeb.ErrorHTML, json: OrbitWeb.ErrorJSON],
    layout: false
  ],
  pubsub_server: Orbit.PubSub,
  live_view: [signing_salt: "5ANP5/by"]

# CSV import jobs
config :orbit, Orbit.Import.Personnel, pathname: nil
config :orbit, Orbit.Import.Rfid, pathname: nil

config :orbit, Oban,
  repo: Orbit.Repo,
  plugins: [Oban.Plugins.Pruner, {Oban.Plugins.Lifeline, rescue_after: :timer.minutes(60)}],
  queues: [
    personnel_import: 1,
    rfid_import: 1,
    cert_import: 1
  ]

config :elixir, :time_zone_database, Tz.TimeZoneDatabase

config :phoenix,
  # Use Jason for JSON parsing in Phoenix
  json_library: Jason,
  # We use logster instead of the default Phoenix logging
  logger: false

# Auth
config :ueberauth, Ueberauth,
  providers: [
    # specified in dev.exs / prod.exs
    keycloak: nil
  ]

# Import environment specific config. This must remain at the bottom
# of this file so it overrides the configuration defined above.
import_config "#{config_env()}.exs"
