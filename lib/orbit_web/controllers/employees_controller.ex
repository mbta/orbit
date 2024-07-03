defmodule OrbitWeb.EmployeesController do
  alias Orbit.Employee
  use OrbitWeb, :controller
  import Ecto.Query

  alias Orbit.Repo

  @spec index(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def index(conn, _params) do
    employees =
      Enum.map(
        Repo.all(from(e in Employee)),
        fn e ->
          %{
            first_name: e.first_name,
            # preferred_first: e.preferred_first,
            last_name: e.last_name,
            badge: e.badge_number
          }
        end
      )

    conn |> json(%{data: employees})
  end
end
