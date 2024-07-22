defmodule OrbitWeb.EmployeesController do
  alias Orbit.Employee
  use OrbitWeb, :controller
  import Ecto.Query

  alias Orbit.Repo

  @spec index(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def index(conn, _params) do
    employees =
      Enum.map(
        Repo.all(
          from e in Employee,
            join: b in assoc(e, :badge_serials),
            where: e.id == b.employee_id,
            preload: [badge_serials: b]
        ),
        fn e ->
          %{
            first_name: e.first_name,
            preferred_first: e.preferred_first,
            last_name: e.last_name,
            badge: e.badge_number,
            badge_serials: Enum.map(e.badge_serials, & &1.badge_serial)
          }
        end
      )

    json(conn, %{data: employees})
  end
end
