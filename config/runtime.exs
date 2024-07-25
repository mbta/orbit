import Config

# config/runtime.exs is executed for all environments, including
# during releases. It is executed after compilation and before the
# system starts, so it is typically used to load production configuration
# and secrets from environment variables or elsewhere. Do not define
# any compile-time configuration in here, as it won't be applied.
# The block below contains prod specific runtime configuration.
if config_env() == :prod do
  maybe_ipv6 = if System.get_env("ECTO_IPV6") in ~w(true 1), do: [:inet6], else: []

  config :orbit, environment: System.get_env("ENVIRONMENT")

  config :orbit, Orbit.Repo,
    socket_options: maybe_ipv6,
    username: System.get_env("DATABASE_USERNAME"),
    password: System.get_env("DATABASE_PASSWORD"),
    database: System.get_env("DATABASE_NAME"),
    hostname: System.get_env("DATABASE_HOST"),
    ssl: System.get_env("DATABASE_DISABLE_SSL") != "insecure-yes",
    ssl_opts: [
      verify: :verify_peer,
      cacertfile: "/usr/local/share/amazon-certs.pem",
      server_name_indication: String.to_charlist(System.get_env("DATABASE_HOST")),
      verify_fun:
        {&:ssl_verify_hostname.verify_fun/3,
         [check_hostname: String.to_charlist(System.get_env("DATABASE_HOST"))]}
    ],
    # function to call before every connection
    # add RDS IAM auth, but only if there's no password
    configure:
      (if System.get_env("DATABASE_PASSWORD") == nil do
         {Orbit.Repo, :add_prod_credentials, []}
       end)

  # S3
  config :orbit, Orbit.S3,
    folders: [
      glides_global: "s3://#{System.fetch_env!("GLIDES_BUCKET")}/global"
    ]

  # CSV import jobs
  config :orbit, Orbit.Import.Personnel, pathname: System.fetch_env!("GLIDES_PERSONNEL_PATHNAME")
  config :orbit, Orbit.Import.Rfid, pathname: System.fetch_env!("GLIDES_RFID_PATHNAME")

  # Auth
  config :ueberauth_oidcc,
    issuers: [
      %{
        name: :keycloak_issuer,
        issuer: System.fetch_env!("KEYCLOAK_ISSUER")
      }
    ],
    providers: [
      keycloak: [
        issuer: :keycloak_issuer,
        client_id: System.fetch_env!("KEYCLOAK_CLIENT_ID"),
        client_secret: System.fetch_env!("KEYCLOAK_CLIENT_SECRET")
      ]
    ]

  config :orbit, OrbitWeb.Auth.Guardian, secret_key: System.get_env("GUARDIAN_SECRET_KEY")

  # The secret key base is used to sign/encrypt cookies and other secrets.
  # A default value is used in config/dev.exs and config/test.exs but you
  # want to use a different value for prod and you most likely don't want
  # to check this value into version control, so we use an environment
  # variable instead.
  secret_key_base =
    System.get_env("SECRET_KEY_BASE") ||
      raise """
      environment variable SECRET_KEY_BASE is missing.
      You can generate one by calling: mix phx.gen.secret
      """

  host = System.fetch_env!("PHX_HOST")
  port = String.to_integer(System.get_env("PORT") || "4001")

  config :orbit, OrbitWeb.Endpoint,
    url: [host: host, port: 443, scheme: "https"],
    http: [
      # Enable IPv6 and bind on all interfaces.
      # Set it to  {0, 0, 0, 0, 0, 0, 0, 1} for local network only access.
      # See the documentation on https://hexdocs.pm/bandit/Bandit.html#t:options/0
      # for details about using IPv6 vs IPv4 and loopback vs public addresses.
      ip: {0, 0, 0, 0, 0, 0, 0, 0},
      port: port
    ],
    secret_key_base: secret_key_base

  config :sentry,
    dsn: System.get_env("SENTRY_DSN"),
    environment_name: System.get_env("ENVIRONMENT")
end
