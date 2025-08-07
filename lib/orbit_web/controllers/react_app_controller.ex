defmodule OrbitWeb.ReactAppController do
  use OrbitWeb, :controller

  def home(conn, _params) do
    # The home page is often custom made,
    # so skip the default app layout.
    render(conn, :react_app,
      layout: false,
      appcues_enabled?: Application.get_env(:orbit, :appcues_enabled?),
      appcues_id: Application.get_env(:orbit, :appcues_id),
      appcues_uid: appcues_uid(conn),
      environment: Application.get_env(:orbit, :environment),
      full_story_org_id: Application.get_env(:orbit, :full_story_org_id),
      guardian_token: Guardian.Plug.current_token(conn),
      laboratory_features: laboratory_features(conn),
      sentry_dsn: Application.get_env(:sentry, :dsn)
    )
  end

  # Use half a sha256 of the email address as user id.
  # This is not secure! But we're eliminating randomness
  #  while not being trivially overridable.
  defp appcues_uid(conn) do
    :crypto.hash(:sha3_256, conn.assigns[:email])
    |> Base.encode16(case: :lower)
    |> String.slice(0..32)
  end

  defp laboratory_features(conn) do
    :laboratory
    |> Application.get_env(:features)
    |> Map.new(fn {key, _, _} -> {key, Laboratory.enabled?(conn, key)} end)
  end
end
