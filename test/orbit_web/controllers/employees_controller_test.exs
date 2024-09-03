defmodule OrbitWeb.EmployeesControllerTest do
  use OrbitWeb.ConnCase
  import Orbit.Factory

  describe "index" do
    @tag :authenticated
    test "fetches all employees", %{conn: conn} do
      insert(:employee)
      insert(:employee, preferred_first: nil)
      conn = get(conn, ~p"/api/employees")

      assert %{
               "data" => [
                 %{
                   "badge" => _badge1,
                   "first_name" => "Preferredy",
                   "last_name" => "Person"
                 },
                 %{
                   "badge" => _badge2,
                   "first_name" => "Fake",
                   "last_name" => "Person"
                 }
               ]
             } = json_response(conn, 200)
    end
  end
end
