defmodule OrbitWeb.Plugs.RequireLogin do
  @behaviour Plug

  alias Orbit.Authentication.User
  alias OrbitWeb.Auth.Auth

  @impl Plug
  def init(opts), do: opts

  @impl Plug
  def call(conn, _opts) do
    if user = Auth.logged_in_user(conn) do
      # TODO: Sentry
      # Sentry.Context.set_user_context(%{
      #   email: user.email
      # })

      # TODO: Logger
      # Logger.metadata(remote_ip: nil)

      names = User.get_names_from_employee(user)

      name =
        case names do
          nil -> nil
          %{preferred_first: x} -> x
          %{first_name: x} -> x
        end

      conn
      |> Plug.Conn.assign(:email, user.email)
      |> Plug.Conn.assign(:name, name)
      |> Plug.Conn.assign(:logged_in_user, user)
    else
      conn
      |> Plug.Conn.put_session(:login_target, conn.request_path)
      |> OrbitWeb.AuthController.redirect_needs_login()
      |> Plug.Conn.halt()
    end
  end
end
