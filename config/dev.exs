import Config

# Application config
config :orbit,
  # Enable dev routes for dashboard and mailbox
  dev_routes: true

# Database config
config :orbit, Orbit.Repo,
  username: "postgres",
  password: "postgres",
  hostname: "localhost",
  database: "orbit_dev",
  stacktrace: true,
  show_sensitive_data_on_connection_error: true,
  pool_size: 10

# Endpoint config
# For development, we disable any cache and enable
# debugging and code reloading.
#
# The watchers configuration can be used to run external
# watchers to your application. For example, we can use it
# to bundle .js and .css sources.
config :orbit, OrbitWeb.Endpoint,
  # Binding to loopback ipv4 address prevents access from other machines.
  # Change to `ip: {0, 0, 0, 0}` to allow access from other machines.
  http: [ip: {127, 0, 0, 1}, port: 4000],
  check_origin: false,
  code_reloader: true,
  debug_errors: true,
  secret_key_base: "0EUYwTuYjv3d29zcLfEM4kG6gt+9p8gGHpimBuVfafFqQFKAuYIzHT7OGlfjjaS+",
  watchers: [
    npm: ~w(run build:js -- --sourcemap=inline --watch),
    npm: ~w(run build:css -- --watch)
  ],
  # Watch static and templates for browser reloading.
  live_reload: [
    patterns: [
      ~r"priv/static/(?!uploads/).*(js|css|png|jpeg|jpg|gif|svg)$",
      ~r"lib/orbit_web/(controllers|live|components)/.*(ex|heex)$"
    ]
  ]

# Logging config
# Do not include metadata nor timestamps in development logs
config :logger, :console, format: "[$level] $message\n"

# Phoenix config
config :phoenix,
  # Set a higher stacktrace during development. Avoid configuring such
  # in production as building large stacktraces may be expensive.
  stacktrace_depth: 20,
  # Initialize plugs at runtime for faster development compilation
  plug_init_mode: :runtime

config :phoenix_live_view,
  # Include HEEx debug annotations as HTML comments in rendered markup
  debug_heex_annotations: true
