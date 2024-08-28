defmodule OrbitWeb.SignInExportControllerTest do
  use OrbitWeb.ConnCase

  describe "get/2" do
    test "unauthenticated requests get redirected to login", %{conn: conn} do
      conn = get(conn, ~p"/sign-in-export", %{"date" => "2024-08-28"})

      assert redirected_to(conn) == ~p"/login"
    end
  end
end
