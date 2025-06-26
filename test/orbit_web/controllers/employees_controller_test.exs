defmodule OrbitWeb.EmployeesControllerTest do
  use OrbitWeb.ConnCase
  import Orbit.Factory

  @moduletag :authenticated

  setup do
    insert(:employee)
    insert(:employee, preferred_first: nil)
    :ok
  end

  describe "index with required permission group" do
    @tag groups: [OrbitWeb.Auth.Groups.orbit_bl_ffd(), OrbitWeb.Auth.Groups.orbit_tid_staff()]
    test "fetches all employees", %{conn: conn} do
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

  describe "index without required permission group" do
    test "returns 403", %{conn: conn} do
      conn = get(conn, ~p"/api/employees")
      assert response(conn, 403)
    end
  end
end
