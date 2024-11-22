# Config for connecting to remote services.
# Nothing here is required, you can develop the app locally without this.
# Copy the template to dev.secret.exs, then uncomment and fill in any sections you need.
import Config

# Appcues
config :orbit,
  appcues_enabled?: true,
  appcues_id: "SOME_ID"

# FullStory
# Only turn this on if you're testing sending data to FullStory, not for regular use.
config :orbit,
  full_story_org_id: ""

# Sentry
# Only turn this on if you're testing sending events to Sentry, not for regular use.
# The DSN comes from https://mbtace.sentry.io/settings/projects/glides/keys/
# server_name is the only metadata that tells Sentry whose local environment sent an event, so set it to your name
# remember to run `mix sentry.package_source_code` after every code change
# config :sentry,
#   dsn: "",
#   environment_name: "local",
#   enable_source_code_context: true,
#   release: Application.compile_env(:orbit, :release),
#   root_source_code_paths: [File.cwd!()],
#   server_name: "<yourname>.local"
