defmodule OrbitWeb.CertificationsController do
  use OrbitWeb, :controller

  alias Orbit.Certification
  alias Orbit.Repo
  import Ecto.Query

  @spec index(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def index(conn, params) do
    badge = params["badge"] || ""

    certs =
      Repo.all(from(c in Certification, where: c.badge == ^badge))
      |> Enum.map(
        &%{
          type: &1.type,
          rail_line: &1.rail_line,
          expires: &1.expires
        }
      )

    json(conn, %{data: certs})
    # json(conn, %{
    #   data: [
    #     %{
    #       type: "rail",
    #       rail_line: "blue",
    #       expires: "2024-12-24"
    #     },
    #     %{
    #       type: "right_of_way",
    #       rail_line: "blue",
    #       expires: "2025-01-24"
    #     }
    #   ]
    # })
  end
end
