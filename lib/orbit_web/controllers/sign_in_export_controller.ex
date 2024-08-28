defmodule OrbitWeb.SignInExportController do
  use OrbitWeb, :controller

  @spec get(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def get(conn, %{"date" => _date_string}) do
    csv = ""

    conn
    |> put_resp_content_type("application/csv")
    |> send_resp(200, csv)
  end
end
