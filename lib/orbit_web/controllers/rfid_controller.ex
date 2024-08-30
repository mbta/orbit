defmodule OrbitWeb.RfidController do
  alias Orbit.BadgeSerial
  use OrbitWeb, :controller
  import Ecto.Query

  alias Orbit.Repo

  @spec show(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def show(conn, %{"badge_serial" => badge_serial}) do
    badge_number =
      Repo.one(
        from b in BadgeSerial,
          left_join: e in assoc(b, :employee),
          where: b.badge_serial == ^badge_serial,
          select: e.badge_number
      )

    if badge_number do
      conn
      |> json(%{data: badge_number})
    else
      conn
      |> put_status(404)
      |> text("Not found")
    end
  end

  def show(conn, _params) do
    conn
    |> put_status(400)
    |> text("Missing query param `badge_serial`")
  end
end
