defmodule OrbitWeb.RfidControllerTest do
  use OrbitWeb.ConnCase
  import Orbit.Factory

  @moduletag :authenticated

  describe "index" do
    test "fetches badge_number by badge_serial", %{conn: conn} do
      insert(:employee,
        badge_number: "123",
        badge_serials: [
          build(:badge_serial, badge_serial: "9999"),
          build(:badge_serial, badge_serial: "9998")
        ]
      )

      conn = get(conn, ~p"/api/rfid?badge_serial=9998")
      assert %{"data" => "123"} = json_response(conn, 200)
    end

    test "returns 404 if serial doesn't exist", %{conn: conn} do
      insert(:employee, badge_serials: [])
      conn = get(conn, ~p"/api/rfid?badge_serial=9998")
      assert response(conn, 404)
    end
  end
end
