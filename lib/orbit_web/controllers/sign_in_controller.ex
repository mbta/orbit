defmodule OrbitWeb.SignInController do
  alias Orbit.Employee
  alias Orbit.OperatorSignIn
  alias OrbitWeb.Auth.Auth

  use OrbitWeb, :controller
  import Ecto.Query

  alias Orbit.Repo

  @spec index(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def index(conn, params) do
    line = params["line"] || "blue"

    service_date =
      if params["service_date"],
        do: Date.from_iso8601!(params["service_date"]),
        else: Util.Time.service_date_for_timestamp(Util.Time.current_time())

    {start_datetime, end_datetime} = Util.Time.service_date_boundaries(service_date)

    rail_line = String.to_existing_atom(line)

    json(
      conn,
      %{
        data:
          Repo.all(
            from(si in OperatorSignIn,
              where:
                ^start_datetime <= si.signed_in_at and
                  si.signed_in_at < ^end_datetime and
                  si.rail_line == ^rail_line,
              preload: [:signed_in_employee, :signed_in_by_user],
              order_by: [desc: :signed_in_at]
            )
          )
          |> Enum.map(fn si ->
            %{
              rail_line: si.rail_line,
              signed_in_at: DateTime.to_iso8601(si.signed_in_at),
              signed_in_by_user: si.signed_in_by_user.email,
              signed_in_employee: si.signed_in_employee.badge_number
            }
          end)
      }
    )
  end

  @spec submit(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def submit(conn, %{
        "signed_in_employee_badge" => signed_in_employee_badge,
        "signed_in_at" => signed_in_at,
        "line" => line,
        "method" => method
      }) do
    signed_in_at = DateTime.from_unix!(signed_in_at)

    case Repo.one(from(e in Employee, where: e.badge_number == ^signed_in_employee_badge)) do
      nil ->
        conn |> send_resp(404, "Employee not found") |> halt()

      emp ->
        %OperatorSignIn{
          signed_in_employee: emp,
          signed_in_by_user: Auth.logged_in_user(conn),
          signed_in_at: signed_in_at,
          rail_line: String.to_existing_atom(line),
          sign_in_method: String.to_existing_atom(method)
        }
        |> OperatorSignIn.changeset()
        |> Repo.insert!()

        text(conn, "OK")
    end
  end
end
