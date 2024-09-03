defmodule OrbitWeb.AdminControllerTest do
  use OrbitWeb.ConnCase
  import Ecto.Query
  import Orbit.Factory
  import Test.Support.Helpers

  alias Orbit.BadgeSerial
  alias Orbit.Employee
  alias Orbit.Repo

  @moduletag :authenticated
  @moduletag groups: ["orbit-admin"]

  describe "permissions" do
    @tag groups: []
    test "get fails if not admin", %{conn: conn} do
      conn = get(conn, ~p"/admin/employee")
      assert response(conn, :forbidden)
    end

    @tag groups: []
    test "post fails if not admin", %{conn: conn} do
      conn = post(conn, ~p"/admin/employee", %{})
      assert response(conn, :forbidden)
    end

    test "post fails if not allow_test_data", %{conn: conn} do
      reassign_env(:orbit, :allow_test_data?, false)
      conn = post(conn, ~p"/admin/employee", %{})
      assert response(conn, :method_not_allowed)
    end
  end

  describe "employees" do
    test "get loads form", %{conn: conn} do
      conn = get(conn, ~p"/admin/employee")
      assert response = html_response(conn, 200)
      assert response =~ "<button"
    end

    test "post badge number is required", %{conn: conn} do
      conn = post(conn, ~p"/admin/employee", %{})
      assert response(conn, 400)
    end

    test "post makes new employee with X badge number", %{conn: conn} do
      conn = post(conn, ~p"/admin/employee", %{"badge_number" => "123"})
      assert response(conn, 200)
      assert %Employee{} = Repo.one!(from(e in Employee, where: e.badge_number == "X123"))
    end

    test "delete works", %{conn: conn} do
      insert(:employee,
        badge_number: "123",
        badge_serials: [build(:badge_serial)]
      )

      conn = delete(conn, ~p"/admin/employee", %{"badge_number" => "123"})
      assert response(conn, 200)
      assert [] = Repo.all(Employee)
      assert [] = Repo.all(BadgeSerial)
    end

    test "delete returns 404", %{conn: conn} do
      conn = delete(conn, ~p"/admin/employee", %{"badge_number" => "123"})
      assert response(conn, 404)
    end
  end

  describe "rfid" do
    test "get loads form", %{conn: conn} do
      conn = get(conn, ~p"/admin/rfid")
      assert response = html_response(conn, 200)
      assert response =~ "<button"
    end

    test "post fails if employee doesn't exist", %{conn: conn} do
      conn =
        post(conn, ~p"/admin/rfid", %{
          "badge_number" => "doesnotexist",
          "badge_serial" => "9999"
        })

      assert response(conn, 400)
    end

    test "post can make badge", %{conn: conn} do
      %Employee{
        badge_number: "X123"
      }
      |> Employee.changeset()
      |> Repo.insert!()

      conn =
        post(conn, ~p"/admin/rfid", %{
          "badge_number" => "X123",
          "badge_serial" => "9999"
        })

      assert response(conn, 200)

      assert %BadgeSerial{employee: %Employee{badge_number: "X123"}} =
               Repo.one!(
                 from(badge_serial in BadgeSerial,
                   where: badge_serial.badge_serial == "9999",
                   preload: [:employee]
                 )
               )
    end

    test "delete works", %{conn: conn} do
      insert(:badge_serial, badge_serial: "9999")
      conn = delete(conn, ~p"/admin/rfid", %{"badge_serial" => "9999"})
      assert response(conn, 200)
      assert [] = Repo.all(BadgeSerial)
    end

    test "delete returns 404", %{conn: conn} do
      conn = delete(conn, ~p"/admin/rfid", %{"badge_serial" => "9999"})
      assert response(conn, 404)
    end
  end
end
