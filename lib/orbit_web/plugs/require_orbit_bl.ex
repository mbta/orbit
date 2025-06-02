defmodule OrbitWeb.Plugs.RequireOrbitBl do
  @behaviour Plug

  alias OrbitWeb.Auth.Auth

  @impl Plug
  def init(opts), do: opts

  @impl Plug
  def call(conn, _opts) do
    user = Auth.logged_in_user(conn)

    if user != nil and "orbit-bl-test" in user.groups do
      conn
    else
      conn
      # |> Plug.Conn.put_status(:forbidden)
      # |> Phoenix.Controller.text("You do not have permission to view this page")
      |> Phoenix.Controller.redirect(to: "/no-permissions")
      |> Plug.Conn.halt()
    end
  end
end
