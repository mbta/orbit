defmodule OrbitWeb.HealthDbController do
  @moduledoc """
  Controller that runs a database query to check whether the webserver can connect to the database.
  """
  use OrbitWeb, :controller
  import Ecto.Query

  alias Orbit.Repo

  def index(conn, _params) do
    count = Repo.one(from(migration in "schema_migrations", select: count(migration)))
    conn
    |> put_status(200)
    |> text("#{count}")
  end
end
