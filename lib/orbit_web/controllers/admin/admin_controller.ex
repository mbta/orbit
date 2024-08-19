defmodule OrbitWeb.Admin.AdminController do
  use OrbitWeb, :controller
  import Ecto.Query

  alias Orbit.Employee
  alias Orbit.BadgeSerial
  alias Orbit.Repo

  plug(OrbitWeb.Plugs.RequireAdmin)

  @spec get_rfid(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def get_rfid(conn, _params) do
    render(conn, :rfid, layout: false)
  end

  @spec post_rfid(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def post_rfid(conn, %{
        "badge_number" => badge_number,
        "badge_serial" => badge_serial
      })
      when is_binary(badge_number) and
             badge_number != "" and
             is_binary(badge_serial) and
             badge_serial != "" do
    employee = Repo.one(from e in Employee, where: e.badge_number == ^badge_number)

    if employee != nil do
      %BadgeSerial{
        employee: employee,
        badge_serial: badge_serial
      }
      |> BadgeSerial.changeset()
      |> Repo.insert!()

      text(conn, "OK")
    else
      conn
      |> put_status(400)
      |> text("Error: no employee with badge_number #{badge_number}")
    end
  end

  def post_rfid(conn, _params) do
    conn
    |> put_status(400)
    |> text("Error: need params `badge_number` and `badge_serial`")
  end
end
