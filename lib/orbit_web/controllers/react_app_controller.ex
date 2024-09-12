defmodule OrbitWeb.ReactAppController do
  use OrbitWeb, :controller

  def home(conn, _params) do
    # The home page is often custom made,
    # so skip the default app layout.
    render(conn, :react_app,
      layout: false,
      sentry_dsn: Application.get_env(:sentry, :dsn),
      environment: Application.get_env(:orbit, :environment),
      full_story_org_id: Application.get_env(:orbit, :full_story_org_id)
    )
  end
end
