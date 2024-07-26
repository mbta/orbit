defmodule OrbitWeb.AuthController do
  use OrbitWeb, :controller
  plug(Ueberauth)

  alias OrbitWeb.Auth.Auth
  require Logger

  def login_page(conn, _params) do
    if Auth.logged_in_user(conn) do
      redirect_login_successful(conn)
    else
      redirect(conn, to: ~p"/auth/keycloak")
    end
  end

  def request(conn, _params) do
    # either unrecognized provider (recognized providers are caught by Ueberauth
    # before this point) or other keycloak error. Check keycloak logs!
    conn
    |> put_status(:bad_request)
    |> text("Bad Request")
  end

  defp get_logout_url(conn, auth) do
    case UeberauthOidcc.initiate_logout_url(auth, %{
           # We have to generate exactly what Keycloak/EntraID expect for logout redirect
           post_logout_redirect_uri:
             conn
             |> url(~p"/login")
             |> URI.parse()
             # SSL is terminated before Phoenix sees requests, so we have to pretend it's https
             # even if Phoenix thinks it isn't.
             |> Map.put(:scheme, "https")
             # We're on 80, but :80 appended to the URL also makes EntraID unhappy.
             |> Map.put(:port, nil)
             |> URI.to_string()
         }) do
      {:ok, logout_url} -> logout_url
      _ -> nil
    end
  end

  def callback(%{assigns: %{ueberauth_auth: %{provider: :keycloak} = auth}} = conn, _params) do
    # credentials = auth.credentials

    # Ignore auth provider's TTL, set ours to 30 days so users don't have to log back in
    # expiration = credentials.expires_at
    ttl_seconds = 3600 * 24 * 30

    keycloak_client_id =
      get_in(Application.get_env(:ueberauth_oidcc, :providers), [:keycloak, :client_id])

    groups =
      get_in(auth.extra.raw_info.userinfo, ["resource_access", keycloak_client_id, "roles"]) || []

    logout_url = get_logout_url(conn, auth)

    conn
    |> Auth.login(
      auth.info.email,
      ttl_seconds,
      groups,
      logout_url
    )
    |> redirect_login_successful()
  end

  def callback(%{assigns: %{ueberauth_failure: fail}} = conn, _params) do
    # what to do if sign in fails
    case fail.errors do
      [%Ueberauth.Failure.Error{message_key: "csrf_attack"}] ->
        # Don't log CSRF issues
        nil

      _ ->
        Logger.warning("Ueberauth failure: #{inspect(fail)}")
    end

    conn
    |> Auth.logout()
    |> redirect_needs_login()
  end

  def callback(conn, _params) do
    conn
    |> put_status(:bad_request)
    |> text("Bad Request (unrecognized provider)")
  end

  def redirect_needs_login(conn) do
    if get_format(conn) == "html" do
      redirect(conn, to: ~p"/login")
    else
      conn
      |> put_status(:unauthorized)
      |> text("Unauthorized")
      |> halt()
    end
  end

  defp redirect_login_successful(conn) do
    redirect_to = Plug.Conn.get_session(conn, :login_target) || ~p"/"

    conn
    |> Plug.Conn.delete_session(:login_target)
    |> redirect(to: redirect_to)
  end

  def logout(conn, _params) do
    logout_url = get_session(conn, "logout_url")

    if logout_url != nil do
      conn
      |> Auth.logout()
      |> redirect(external: logout_url)
    else
      conn
      |> Auth.logout()
      |> html(~s{Logged out. <a href="/"> Log in again. </a>})
    end
  end
end
