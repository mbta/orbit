defmodule OrbitWeb.Admin.AdminController do
  use OrbitWeb, :controller
  import Ecto.Query

  alias Orbit.BadgeSerial
  alias Orbit.Employee
  alias Orbit.Repo

  plug(OrbitWeb.Plugs.RequireAdmin)

  plug(
    OrbitWeb.Plugs.RequireAllowTestData
    when action in [
           :post_employee,
           :post_rfid
         ]
  )

  @spec get_remove(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def get_remove(conn, _params) do
    render(conn, :remove, layout: false)
  end

  @remove_after_timestamp ~N[2024-10-03 00:00:00]

  @spec post_remove(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def post_remove(conn, _params) do
    {count_bs, _} =
      Repo.delete_all(from(bs in BadgeSerial, where: bs.inserted_at > ^@remove_after_timestamp))

    {count_e, _} =
      Repo.delete_all(from(e in Employee, where: e.inserted_at > ^@remove_after_timestamp))

    text(conn, "Removed #{count_bs} BadgeSerial(s), #{count_e} Employee(s).")
  end

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
      case params["area"] && Integer.parse(params["area"]) do
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

  @spec delete_employee(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def delete_employee(conn, %{
        "badge_number" => badge_number
      })
      when is_binary(badge_number) and badge_number != "" do
    {count, _} = Repo.delete_all(from(e in Employee, where: e.badge_number == ^badge_number))

    case count do
      0 ->
        conn
        |> put_status(404)
        |> text("Employee ##{badge_number} not found, no data deleted.")

      1 ->
        conn
        |> put_status(200)
        |> text("Deleted employee data")
    end
  end

  def delete_employee(conn, _params) do
    conn
    |> put_status(400)
    |> text("Error: need param `badge_number`")
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
      |> Repo.insert!(
        on_conflict: {:replace_all_except, [:id, :inserted_at]},
        conflict_target: :badge_serial
      )

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

  @spec delete_rfid(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def delete_rfid(conn, %{
        "badge_serial" => badge_serial
      })
      when is_binary(badge_serial) and badge_serial != "" do
    {count, _} = Repo.delete_all(from(b in BadgeSerial, where: b.badge_serial == ^badge_serial))

    case count do
      0 ->
        conn
        |> put_status(404)
        |> text("Badge serial #{badge_serial} not found, no data deleted.")

      1 ->
        conn
        |> put_status(200)
        |> text("Deleted badge serial")
    end
  end

  def delete_rfid(conn, _params) do
    conn
    |> put_status(400)
    |> text("Error: need param `badge_serial`")
  end
end
