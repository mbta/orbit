defmodule OrbitWeb.ReactAppControllerTest do
  use OrbitWeb.ConnCase

  @tag :authenticated
  test "GET /", %{conn: conn} do
    conn = get(conn, ~p"/")
    response = html_response(conn, 200)
    assert response =~ "Orbit"

    # sets metadata
    assert response =~ "<meta name=\"release\" content=\"test\">"
    assert response =~ "<meta name=\"userEmail\" content=\"user@example.com\">"
  end
end
