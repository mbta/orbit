defmodule OrbitWeb.Auth.Strategy.FakeOidcc do
  use Ueberauth.Strategy, ignores_csrf_attack: true
  use OrbitWeb, :controller
  import OrbitWeb.Auth.Groups

  @impl Ueberauth.Strategy
  def handle_request!(conn) do
    groups = [orbit_admin(), orbit_bl_ffd(), orbit_rl_trainstarters(), orbit_tid_staff()]

    conn
    |> put_resp_content_type("text/html")
    |> put_view(OrbitWeb.Layouts)
    |> render(:fake_login, groups: groups, layout: false)
    |> halt()
  end

  @impl Ueberauth.Strategy
  def handle_callback!(conn) do
    # add a /.../callback?invalid query param to mock an invalid token for testing
    if Map.has_key?(conn.params, "invalid") or is_nil(conn.params["email"]) do
      set_errors!(conn, [error("invalid", "invalid callback")])
    else
      conn
    end
  end

  @impl Ueberauth.Strategy
  def uid(_conn) do
    "fake_uid"
  end

  @impl Ueberauth.Strategy
  def credentials(_conn) do
    nine_hours_in_seconds = 9 * 60 * 60
    expiration_time = System.system_time(:second) + nine_hours_in_seconds

    %Ueberauth.Auth.Credentials{
      token: "fake_access_token",
      refresh_token: "fake_refresh_token",
      expires: true,
      expires_at: expiration_time
    }
  end

  @impl Ueberauth.Strategy
  def info(conn) do
    email = Map.get(conn.params, "email")

    %Ueberauth.Auth.Info{
      email: email
    }
  end

  @impl Ueberauth.Strategy
  def extra(conn) do
    groups = conn.params["groups"] || []

    keycloak_client_id =
      get_in(Application.get_env(:ueberauth_oidcc, :providers), [:keycloak, :client_id])

    %Ueberauth.Auth.Extra{
      raw_info: %UeberauthOidcc.RawInfo{
        userinfo: %{
          "resource_access" => %{
            keycloak_client_id => %{"roles" => groups}
          }
        }
      }
    }
  end

  @impl Ueberauth.Strategy
  def handle_cleanup!(conn) do
    conn
  end
end
