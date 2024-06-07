import Config

# Application config
config :orbit,
  ecto_repos: [Orbit.Repo],
  generators: [timestamp_type: :utc_datetime]

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

# Logging config
config :logger, :console,
  format: "$time $metadata[$level] $message\n",
  metadata: [:request_id]

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
