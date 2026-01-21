defmodule OrbitWeb.AuthControllerTest do
  use OrbitWeb.ConnCase
  alias OrbitWeb.Auth.Auth

  defp login_with_groups(conn, groups) do
    conn
    |> get(~p"/auth/keycloak/callback?#{%{"email" => "user@example.com", "roles" => groups}}")
  end

  describe "/login" do
    test "redirects to keycloak login if unauthenticated", %{conn: conn} do
      conn = get(conn, ~p"/")
      assert redirected_to(conn) == "/login"
    end
  end

  describe "callback" do
    test "valid credentials redirect to /", %{conn: conn} do
      conn = login_with_groups(conn, [])
      assert redirected_to(conn) == "/"
    end

    test "group information is saved in the claims", %{conn: conn} do
      conn = login_with_groups(conn, ["some-group"])
      assert redirected_to(conn) == "/"

      assert %{"groups" => ["some-group"]} = Guardian.Plug.current_claims(conn)
    end

    test "remembers target URL", %{conn: conn} do
      conn = get(conn, "/help")
      assert redirected_to(conn) == ~p"/login"

      conn = login_with_groups(conn, [])

      assert redirected_to(conn) == "/help"
    end

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
