defmodule OrbitWeb.Admin.AdminController do
  use OrbitWeb, :controller
  import Ecto.Query

  alias Orbit.Employee
  alias Orbit.BadgeSerial
  alias Orbit.Repo

  plug(OrbitWeb.Plugs.RequireAdmin)

  @spec get_employee(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def get_employee(conn, _params) do
    render(conn, :employee, layout: false)
  end

  @spec post_employee(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def post_employee(
        conn,
        %{
          "badge_number" => badge_number
        } = params
      )
      when is_binary(badge_number) and
             badge_number != "" do
    badge_number =
      if String.starts_with?(badge_number, "X") do
        badge_number
      else
        "X#{badge_number}"
      end

    area =
      case Integer.parse(params["area"]) do
        {area, ""} -> area
        _ -> nil
      end

    %Employee{
      first_name: empty_to_nil(params["first_name"]),
      preferred_first: empty_to_nil(params["preferred_first"]),
      middle_initial: empty_to_nil(params["middle_initial"]),
      last_name: empty_to_nil(params["last_name"]),
      email: empty_to_nil(params["email"]),
      badge_number: badge_number,
      area: area
    }
    |> Employee.changeset()
    |> Repo.insert!(
      on_conflict: {:replace_all_except, [:id, :inserted_at]},
      conflict_target: :badge_number
    )

    text(conn, "OK")
  end

  def post_employee(conn, _params) do
    conn
    |> put_status(400)
    |> text("Error: need param `badge_number`")
  end

  defp empty_to_nil(str) do
    case str do
      "" -> nil
      _ -> str
    end
  end

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
