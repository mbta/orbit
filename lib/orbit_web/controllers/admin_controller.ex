defmodule OrbitWeb.AdminController do
  use OrbitWeb, :controller

  plug(OrbitWeb.Plugs.RequireAdmin)

  @spec get_rfid(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def get_rfid(conn, _params) do
    conn
    |> html(~s"""
    <h1>admin/rfid</h1>
    <p>Manually Create RFID Badge Serial</p>
    """)
  end

  @spec post_rfid(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def post_rfid(conn, _params) do
    conn
  end
end
