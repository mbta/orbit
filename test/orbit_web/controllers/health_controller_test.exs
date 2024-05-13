defmodule OrbitWeb.HealthControllerTest do
  use OrbitWeb.ConnCase

  test "GET /_health", %{conn: conn} do
    conn = get(conn, ~p"/_health")
    assert response(conn, 200)
  end
end
