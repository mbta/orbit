defmodule OrbitWeb.AuthControllerTest do
  use OrbitWeb.ConnCase
  alias OrbitWeb.Auth.Auth

  defp login_with_groups(conn, _groups) do
    conn
    |> get(~p"/auth/keycloak/callback?#{%{"email" => "user@example.com"}}")
  end

  describe "login_page" do
    test "redirects to keycloak login (i.e. there isn't one)", %{conn: conn} do
      conn = get(conn, ~p"/")
      assert redirected_to(conn) == "/login"
    end
  end

  describe "callback" do
    test "valid credentials redirect to /", %{conn: conn} do
      conn = login_with_groups(conn, [])
      assert redirected_to(conn) == "/"
    end

    # test "remembers target URL", %{conn: conn} do
    #   conn = get(conn, "/some/internal/page")
    #   assert redirected_to(conn) == ~p"/login"

    #   conn = login_with_groups(conn, [])

    #   assert redirected_to(conn) == "/some/internal/page"
    # end

    @tag capture_log: true
    test "invalid credentials redirect to /login", %{conn: conn} do
      conn = get(conn, ~p"/auth/keycloak/callback?#{%{"invalid" => "true"}}")
      assert redirected_to(conn) == "/login"
    end

    test "returns 400 on unrecognized provider", %{conn: conn} do
      conn = get(conn, ~p"/auth/badprovider/callback")
      assert response(conn, 400)
    end
  end

  describe "logout" do
    test "logs out", %{conn: conn} do
      conn = login_with_groups(conn, [])
      assert Auth.logged_in_user(conn)
      conn = get(conn, ~p"/logout")
      assert response(conn, 200)
      assert Auth.logged_in_user(conn) == nil
    end
  end
end
