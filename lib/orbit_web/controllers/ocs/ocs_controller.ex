defmodule OrbitWeb.OcsController do
  alias Orbit.Ocs.Train
  alias Orbit.Ocs.Trip
  alias Orbit.Repo

  import Ecto.Query
  use OrbitWeb, :controller

  @spec trips(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def trips(conn, _params) do
    today = Util.Time.current_service_date()

    render(conn, :trips,
      trips:
        Repo.all(
          from(trip in Trip,
            where: trip.service_date == ^today,
            order_by: :rail_line
          )
        )
    )
  end

  @spec trains(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def trains(conn, _params) do
    today = Util.Time.current_service_date()

    render(conn, :trains,
      trains:
        Repo.all(
          from(train in Train,
            where: train.service_date == ^today,
            order_by: :rail_line
          )
        )
    )
  end
end
