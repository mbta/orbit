defmodule OrbitWeb.SignInExportController do
  use OrbitWeb, :controller
  alias Orbit.Employee
  alias Orbit.OperatorSignIn
  alias Orbit.Repo

  import Ecto.Query

  @timezone Application.compile_env!(:orbit, :timezone)

  @spec get(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def get(conn, %{"date" => date_string}) do
    case Date.from_iso8601(date_string) do
      {:ok, date} ->
        conn
        |> put_resp_content_type("application/csv")
        |> send_resp(200, fetch_sign_ins_csv(date))

      {:error, _} ->
        conn
        |> put_status(:bad_request)
        |> text("Bad Request")
    end
  end

  @spec fetch_sign_ins_csv(Date.t()) :: String.t()
  defp fetch_sign_ins_csv(service_date) do
    {start_datetime, end_datetime} = Util.Time.service_date_boundaries(service_date)

    rows =
      Repo.all(
        from osi in OperatorSignIn,
          where: ^start_datetime < osi.signed_in_at and osi.signed_in_at < ^end_datetime,
          order_by: osi.signed_in_at,
          join: e in assoc(osi, :signed_in_employee),
          join: u in assoc(osi, :signed_in_by_user),
          preload: [signed_in_employee: e, signed_in_by_user: u]
      )
      |> Enum.map(
        &%{
          time:
            &1.signed_in_at
            |> DateTime.shift_zone!(@timezone)
            |> Timex.format!("{YYYY}-{0M}-{0D} {0h24}:{0m}:{0s}"),
          location: "Orient Heights",
          signer_badge: &1.signed_in_employee.badge_number,
          signer_name: Employee.display_name(&1.signed_in_employee),
          method:
            case &1.sign_in_method do
              :nfc -> "tap"
              :manual -> "type"
            end,
          text_version: 1
        }
      )

    rows
    |> CSV.encode(
      headers: [
        time: "Time",
        location: "Location",
        signer_badge: "Signer Badge #",
        signer_name: "Signer Name",
        method: "Method",
        text_version: "Text Version"
      ],
      delimiter: "\n"
    )
    |> Enum.join()
  end
end
