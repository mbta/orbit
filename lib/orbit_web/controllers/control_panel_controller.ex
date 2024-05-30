defmodule OrbitWeb.ControlPanelController do
  @moduledoc """
  Controller that runs a database query to check whether the webserver can connect to the database.
  """
  use OrbitWeb, :controller

  def index(conn, _params) do
    render(conn, :index)
  end
end
