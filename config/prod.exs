# Runtime production configuration, including reading
# of environment variables, is done on config/runtime.exs.
import Config

config :orbit,
  # loaded at compile time
  release: System.get_env("RELEASE")

config :orbit, Orbit.Repo,
  # credentials are loaded in runtime.exs
  pool_size: 10

config :orbit, Oban,
  plugins: [
    Oban.Plugins.Pruner,
    {Oban.Plugins.Lifeline, rescue_after: :timer.minutes(60)},
    {Oban.Plugins.Cron,
     timezone: "America/New_York",
     crontab: [
       # 3:50 AM, any day, any month, any day of the week
       {"50 3 * * *", Orbit.Import.PersonnelWorker},
       # 4:00 AM, any day, any month, any day of the week
       {"00 4 * * *", Orbit.Import.RfidWorker}
     ]}
  ]

# Note we also include the path to a cache manifest
# containing the digested version of static files. This
# manifest is generated by the `mix assets.deploy` task,
# which you should run after static files are built and
# before starting your production server.
config :orbit, OrbitWeb.Endpoint,
  server: true,
  cache_static_manifest: "priv/static/cache_manifest.json"

config :orbit, Orbit.S3,
  folders: [
    glides_global: nil
  ]

config :logger, level: :info

config :logger, :console,
  format: "$time [$level] node=$node $metadata$message\n",
  metadata: [:request_id, :remote_ip]

config :ehmon, :report_mf, {:ehmon, :info_report}

# diskusage_logger calls disksup,
# which by default uses df flags that aren't available on alpine's busybox.
# this tells disksup to use different df flags
config :os_mon, disksup_posix_only: true

# Auth
config :orbit, OrbitWeb.Auth.Guardian, issuer: "orbit"

config :ueberauth, Ueberauth,
  providers: [
    keycloak:
      {Ueberauth.Strategy.Oidcc,
       [
         issuer: :keycloak_issuer,
         userinfo: true,
         uid_field: "email",
         scopes: ~w"openid email"
       ]}
  ]

config :sentry,
  # dsn and environment_name are loaded at runtime
  enable_source_code_context: true,
  release: Application.compile_env(:orbit, :release),
  root_source_code_paths: [File.cwd!()]
