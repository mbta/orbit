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
      |> Plug.Conn.put_status(:forbidden)
      |> Phoenix.Controller.text("Forbidden")
      |> Plug.Conn.halt()
    end
  end
end
