defmodule OrbitWeb.EmployeesController do
  use OrbitWeb, :controller

  alias Orbit.Employee
  alias Orbit.Repo

  @spec index(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def index(conn, _params) do
    employees =
      Enum.map(
        Repo.all(Employee),
        fn e ->
          %{
            first_name: e.preferred_first || e.first_name,
            last_name: e.last_name,
            badge: e.badge_number
          }
        end
      )

    json(conn, %{data: employees})
  end
end
