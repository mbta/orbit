defmodule OrbitWeb.SignInExportController do
  use OrbitWeb, :controller
  alias Orbit.Employee
  alias Orbit.OperatorSignIn
  alias Orbit.Repo

  import Ecto.Query

  @timezone Application.compile_env!(:orbit, :timezone)

  @spec get_redirect(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def get_redirect(conn, %{"date" => date_string}) do
    filename = "sign-ins-#{date_string}.csv"

    redirect(conn, to: ~p"/sign-in-export/#{filename}")
  end

  @spec get(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def get(conn, %{"filename" => filename}) do
    with %{"date_string" => date_string} <-
           Regex.named_captures(~r"sign-ins-(?<date_string>.+)\.csv", filename),
         {:ok, date} <- Date.from_iso8601(date_string) do
      conn
      |> put_resp_content_type("application/csv")
      |> send_resp(200, fetch_sign_ins_csv(date))
    else
      _ ->
        conn
        |> put_status(:bad_request)
        |> text("Bad Request")
    end
  end

  @spec fetch_sign_ins_csv(Date.t()) :: String.t()
  defp fetch_sign_ins_csv(service_date) do
    {start_datetime, end_datetime} = Util.Time.service_date_boundaries(service_date)

    Repo.all(
      from operator_sign_in in OperatorSignIn,
        where:
          ^start_datetime < operator_sign_in.signed_in_at and
            operator_sign_in.signed_in_at < ^end_datetime,
        order_by: operator_sign_in.signed_in_at,
        join: e in assoc(operator_sign_in, :signed_in_employee),
        join: u in assoc(operator_sign_in, :signed_in_by_user),
        preload: [signed_in_employee: e, signed_in_by_user: u],
        left_join: signed_in_by_employee in Employee,
        on: u.email == signed_in_by_employee.email,
        select: %{
          operator_sign_in: operator_sign_in,
          signed_in_by_employee: signed_in_by_employee
        }
    )
    |> Enum.map(
      &%{
        time:
          &1.operator_sign_in.signed_in_at
          |> DateTime.shift_zone!(@timezone)
          |> Timex.format!("{YYYY}-{0M}-{0D} {0h24}:{0m}:{0s}"),
        location: "Orient Heights",
        signer_badge: &1.operator_sign_in.signed_in_employee.badge_number,
        signer_name: Employee.display_name(&1.operator_sign_in.signed_in_employee),
        official_badge:
          if &1.signed_in_by_employee do
            &1.signed_in_by_employee.badge_number
          else
            nil
          end,
        official_name:
          if &1.signed_in_by_employee do
            Employee.display_name(&1.signed_in_by_employee)
          else
            &1.operator_sign_in.signed_in_by_user.email
          end,
        method:
          case &1.operator_sign_in.sign_in_method do
            :nfc -> "tap"
            :manual -> "type"
          end,
        text_version: 1
      }
    )
    |> CSV.encode(
      headers: [
        time: "Time",
        location: "Location",
        signer_badge: "Signer Badge #",
        signer_name: "Signer Name",
        official_badge: "Official Badge #",
        official_name: "Official Name",
        method: "Method",
        text_version: "Text Version"
      ],
      delimiter: "\n"
    )
    |> Enum.join()
  end
end
