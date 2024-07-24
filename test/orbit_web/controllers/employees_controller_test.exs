defmodule OrbitWeb.EmployeesControllerTest do
  use OrbitWeb.ConnCase
  import Orbit.Factory

  describe "index" do
    @tag :authenticated
    test "fetches all employees", %{conn: conn} do
      insert(:employee)
      conn = get(conn, ~p"/api/employees")

      assert %{
               "data" => [
                 %{
                   "badge" => _badge,
                   "first_name" => "Fake",
                   "last_name" => "Person",
                   "preferred_first" => "Preferredy",
                   "badge_serials" => [_badge_serial]
                 }
               ]
             } = json_response(conn, 200)
    end

    @tag :authenticated
    test "fetches employees without badge serial data", %{conn: conn} do
      insert(:employee, %{badge_serials: []})
      conn = get(conn, ~p"/api/employees")

      assert %{
               "data" => [
                 %{
                   "badge" => _badge,
                   "first_name" => "Fake",
                   "last_name" => "Person",
                   "preferred_first" => "Preferredy",
                   "badge_serials" => []
                 }
               ]
             } = json_response(conn, 200)
    end
  end
end
