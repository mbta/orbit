defmodule OrbitWeb.CertificationsControllerTest do
  use OrbitWeb.ConnCase
  import Orbit.Factory

  @moduletag :authenticated

  describe "index with required permission group" do
    @tag groups: ["orbit-bl-ffd"]
    test "fetches certifications for a badge", %{conn: conn} do
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

  describe "index without required permission group" do
    test "returns 403", %{conn: conn} do
      emp = insert(:employee)
      insert(:certification, badge: emp.badge_number)

      conn = get(conn, ~p"/api/certifications?badge=#{emp.badge_number}")
      assert "Forbidden" = text_response(conn, 403)
    end
  end
end
