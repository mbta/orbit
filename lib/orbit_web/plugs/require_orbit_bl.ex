defmodule OrbitWeb.Plugs.RequireGroup do
  @behaviour Plug

  alias OrbitWeb.Auth.Auth

  @impl Plug
  def init(opts), do: opts

  @impl Plug
  def call(conn, groups) do
    user = Auth.logged_in_user(conn)

    if user != nil and Enum.all?(groups, fn group -> group in user.groups end) do
      conn
    else
      conn
      |> Plug.Conn.send_resp(:forbidden, "Forbidden")
      |> Plug.Conn.halt()
    end
  end
end
