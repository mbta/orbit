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

# Configure esbuild (the version is required)
config :esbuild,
  version: "0.17.11",
  orbit: [
    args:
      ~w(src/app.ts --bundle --target=es2017 --outdir=../priv/static/assets --external:/fonts/* --external:/images/*),
    cd: Path.expand("../assets", __DIR__),
    env: %{"NODE_PATH" => Path.expand("../deps", __DIR__)}
  ]

# Configure tailwind (the version is required)
config :tailwind,
  version: "3.4.0",
  orbit: [
    args: ~w(
      --config=tailwind.config.js
      --input=css/app.css
      --output=../priv/static/assets/app.css
    ),
    cd: Path.expand("../assets", __DIR__)
  ]

# Logging config
config :logger, :console,
  format: "$time $metadata[$level] $message\n",
  metadata: [:request_id]

config :phoenix,
  # Use Jason for JSON parsing in Phoenix
  json_library: Jason,
  # We use logster instead of the default Phoenix logging
  logger: false

# Import environment specific config. This must remain at the bottom
# of this file so it overrides the configuration defined above.
import_config "#{config_env()}.exs"
