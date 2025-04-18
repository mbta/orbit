defmodule OrbitWeb.SignInController do
  alias Orbit.Certification
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
              join: e in assoc(si, :signed_in_employee),
              join: u in assoc(si, :signed_in_by_user),
              preload: [signed_in_employee: e, signed_in_by_user: u],
              left_join: signed_in_by_employee in Employee,
              on: u.email == signed_in_by_employee.email,
              order_by: [desc: :signed_in_at],
              select: %{
                signin: si,
                signed_in_by_employee: signed_in_by_employee
              }
            )
          )
          |> Enum.map(fn i ->
            %{
              rail_line: i.signin.rail_line,
              signed_in_at: DateTime.to_iso8601(i.signin.signed_in_at),
              signed_in_by:
                if i.signed_in_by_employee do
                  Employee.display_name(i.signed_in_by_employee)
                else
                  i.signin.signed_in_by_user.email
                end,
              signed_in_employee: i.signin.signed_in_employee.badge_number,
              radio_number: i.signin.radio_number
            }
          end)
      }
    )
  end

  @spec validate_override(map()) :: boolean()
  defp validate_override(override) do
    Enum.all?(override, fn cert ->
      MapSet.member?(Certification.certification_type_strings(), cert["type"]) and
        (cert["expires"] == nil || Util.Date.valid_iso8601?(cert["expires"]))
    end)
  end

  @spec submit(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def submit(conn, params) do
    %{
      "signed_in_employee_badge" => signed_in_employee_badge,
      "signed_in_at" => signed_in_at,
      "line" => line,
      "method" => method,
      "radio_number" => radio_number
    } = params

    # Override is separate for backward compatibility
    override = params["override"]
    signed_in_at = DateTime.from_unix!(signed_in_at)

    if override != nil and !validate_override(override) do
      conn |> send_resp(400, "Invalid override\n") |> halt()
    else
      case Repo.one(from(e in Employee, where: e.badge_number == ^signed_in_employee_badge)) do
        nil ->
          conn |> send_resp(404, "Employee not found") |> halt()

        emp ->
          %OperatorSignIn{
            signed_in_employee: emp,
            signed_in_by_user: Auth.logged_in_user(conn),
            signed_in_at: signed_in_at,
            rail_line: String.to_existing_atom(line),
            sign_in_method: String.to_existing_atom(method),
            radio_number: radio_number,
            override: override
          }
          |> OperatorSignIn.changeset()
          |> Repo.insert!()

          text(conn, "OK")
      end
    end
  end
end
