import Config

config :orbit,
  release: "test",
  force_https?: false

# Database config
config :orbit, Orbit.Repo,
  username: System.get_env("DATABASE_USERNAME") || "postgres",
  password: System.get_env("DATABASE_PASSWORD") || "postgres",
  hostname: System.get_env("DATABASE_HOST") || "localhost",
  database: System.get_env("DATABASE_NAME") || "orbit_test",
  pool: Ecto.Adapters.SQL.Sandbox,
  pool_size: System.schedulers_online() * 2

# We don't run a server during test. If one is required,
# you can enable the server option below.
config :orbit, OrbitWeb.Endpoint,
  http: [ip: {127, 0, 0, 1}, port: 4002],
  secret_key_base: "rkME9iHy9nN19cmr5XjoM1hJDX9m2KKjJXUkIRSzgnRWg8IVn8yGaGCNkzEQxkBD",
  server: false

config :orbit, Oban, testing: :inline

config :logger, level: :warning

# Initialize plugs at runtime for faster test compilation
config :phoenix, :plug_init_mode, :runtime

# Auth
config :ueberauth, Ueberauth,
  providers: [
    keycloak: {OrbitWeb.Auth.Strategy.FakeOidcc, []}
  ]

config :ueberauth_oidcc,
  providers: [
    keycloak: [
      issuer: "test-issuer",
      client_id: "test-client-id",
      client_secret: "test-secret"
    ]
  ]

config :orbit, OrbitWeb.Auth.Guardian,
  issuer: "orbit",
  secret_key: "dev key"
