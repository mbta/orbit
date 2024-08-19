defmodule OrbitWeb.Admin.AdminController do
  use OrbitWeb, :controller

  plug(OrbitWeb.Plugs.RequireAdmin)

  @spec get_rfid(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def get_rfid(conn, _params) do
    render(conn, :rfid, layout: false)
  end

  @spec post_rfid(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def post_rfid(conn, _params) do
    conn
  end
end
