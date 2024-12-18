defmodule OrbitWeb.CertificationsControllerTest do
  use OrbitWeb.ConnCase
  import Orbit.Factory

  describe "index" do
    @tag :authenticated
    test "fetches certifications for a abdge", %{conn: conn} do
      emp = insert(:employee)
      insert(:certification, badge: emp.badge_number)

      conn = get(conn, ~p"/api/certifications?badge=#{emp.badge_number}")

      assert %{
               "data" => [
                 %{"expires" => "2023-12-11", "type" => "rail", "rail_line" => "blue"}
               ]
             } = json_response(conn, 200)
    end
  end
end
