defmodule OrbitWeb.ReactAppControllerTest do
  use OrbitWeb.ConnCase
  import Test.Support.Helpers

  setup do
    reassign_env(:sentry, :dsn, "https://example.com")
  end

  @tag :authenticated
  test "GET /", %{conn: conn} do
    conn = get(conn, ~p"/")
    response = html_response(conn, 200)
    assert response =~ "Orbit"

    # sets metadata
    assert response =~ "<meta name=\"release\" content=\"test\">"
    assert response =~ "<meta name=\"userEmail\" content=\"user@example.com\">"
    assert response =~ "<meta name=\"sentryDsn\" content=\"https://example.com\">"
    assert response =~ "<meta name=\"environment\" content=\"test\">"
  end
end
