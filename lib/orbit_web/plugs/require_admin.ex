defmodule OrbitWeb.Plugs.RequireAdmin do
  @behaviour Plug

  alias OrbitWeb.Auth.Auth

  @impl Plug
  def init(opts), do: opts

  @impl Plug
  def call(conn, _opts) do
    user = Auth.logged_in_user(conn)

    if user != nil and Enum.member?(user.groups, "orbit-admin") do
      conn
    else
      conn
      |> Plug.Conn.put_status(:forbidden)
      |> Phoenix.Controller.text("Forbidden")
      |> Plug.Conn.halt()
    end
  end
end
