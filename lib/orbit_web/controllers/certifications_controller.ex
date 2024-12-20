defmodule OrbitWeb.CertificationsController do
  use OrbitWeb, :controller

  @spec index(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def index(conn, _) do
    json(conn, %{
      data: [
        %{
          type: :rail,
          rail_line: :blue,
          expires: "2024-11-25"
        }
        # %{
        #   type: :right_of_way,
        #   rail_line: :blue,
        #   expires: "2024-12-25"
        # }
      ]
    })
  end
end
