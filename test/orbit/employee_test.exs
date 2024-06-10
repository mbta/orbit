defmodule Orbit.EmployeeTest do
  use Orbit.DataCase
  alias Orbit.Employee
  alias Orbit.Repo

  test "can insert an employee into the database" do
    Repo.insert!(%Employee{
      first_name: "Arthur",
      last_name: "Read",
      badge_number: "123456789"
    })
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
end
