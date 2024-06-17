defmodule OrbitWeb.ReactAppController do
  use OrbitWeb, :controller

  def home(conn, _params) do
    # The home page is often custom made,
    # so skip the default app layout.
    render(conn, :react_app, layout: false)
  end
end
