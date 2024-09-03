defmodule Orbit.EmployeeTest do
  use Orbit.DataCase
  import Orbit.Factory

  alias Orbit.Employee
  alias Orbit.Repo

  test "can insert an employee into the database" do
    Repo.insert!(%Employee{
      first_name: "Arthur",
      last_name: "Read",
      badge_number: "123456789"
    })
  end

  test "can add and remove badge serials" do
    first_serial = build(:badge_serial)
    second_serial = build(:badge_serial)

    employee =
      insert(:employee, %{
        badge_serials: [first_serial]
      })

    employee_from_db = Employee |> Repo.get!(employee.id) |> Repo.preload([:badge_serials])

    match_serial = first_serial.badge_serial

    assert %Employee{badge_serials: [%{badge_serial: ^match_serial}]} = employee_from_db

    updated_employee =
      employee_from_db
      |> Employee.changeset(%{badge_serials: [Map.from_struct(second_serial)]})
      |> Repo.update!()

    match_serial = second_serial.badge_serial

    assert %Employee{badge_serials: [%{badge_serial: ^match_serial}]} = updated_employee
  end

  test "cannot insert an employee with a leading zero" do
    assert_raise Ecto.ConstraintError,
                 fn ->
                   Repo.insert!(%Employee{
                     first_name: "Arthur",
                     last_name: "Read",
                     badge_number: "0123456789"
                   })
                 end
  end

  describe "display_name/1" do
    test "uses preferred name if available" do
      employee = build(:employee, %{preferred_first: "Preferred", last_name: "Name"})

      assert Employee.display_name(employee) == "Preferred Name"
    end

    test "uses first name if no preferred name is specified" do
      employee = build(:employee, %{preferred_first: nil, first_name: "First", last_name: "Name"})

      assert Employee.display_name(employee) == "First Name"
    end
  end

  describe "get_by_badge_serial/1" do
    test "fetches employee by badge serial" do
      badge_serial = build(:badge_serial)

      employee =
        insert(:employee, %{
          badge_serials: [badge_serial]
        })

      employee_id = employee.id

      assert %{id: ^employee_id} = Employee.get_by_badge_serial(badge_serial.badge_serial)
    end

    test "returns nil for serial with no corresponding employee" do
      assert is_nil(Employee.get_by_badge_serial("fake_badge_serial"))
    end
  end
end
