defmodule Orbit.Import.PersonnelTest do
  alias Orbit.Employee
  alias Orbit.Import.Personnel
  use Orbit.DataCase

  test "imports an employee within specified area" do
    row = %{
      "FIRST_NAME" => "Nemo",
      "PREF_FIRST_NM_SRCH" => "Neems",
      "MIDDLE_NAME" => "A",
      "LAST_NAME" => "Smith",
      "WORK_EMAIL_ADDRESS" => "NEMO@MBTA.COM",
      "EMPLOYEE_ID" => "123456",
      "CUSTOM_FIELD3" => "Area",
      "CUSTOM_VALUE3" => "114"
    }

    Personnel.import_rows([row], MapSet.new(["114"]))

    assert %Employee{
             badge_number: "123456",
             first_name: "Nemo",
             preferred_first: "Neems",
             middle_initial: "A",
             last_name: "Smith",
             email: "NEMO@MBTA.COM",
             area: 114
           } = Repo.one(from(e in Employee, where: e.first_name == "Nemo"))
  end

  test "ignores an employee outside of specified area" do
    row = %{
      "FIRST_NAME" => "Christopher",
      "CUSTOM_FIELD3" => "Area",
      "CUSTOM_VALUE3" => "115"
    }

    Personnel.import_rows([row], MapSet.new(["114"]))

    assert nil == Repo.one(from(e in Employee, where: e.first_name == "Christopher"))
  end

  test "properly formats fields" do
    row = %{
      "FIRST_NAME" => "NEMO",
      "PREF_FIRST_NM_SRCH" => "NEEMS",
      "MIDDLE_NAME" => "A",
      "LAST_NAME" => "SMITH",
      "EMPLOYEE_ID" => "0123456",
      "CUSTOM_FIELD3" => "Area",
      "CUSTOM_VALUE3" => "114"
    }

    Personnel.import_rows([row], MapSet.new(["114"]))

    assert %Employee{
             badge_number: "123456",
             first_name: "Nemo",
             preferred_first: "Neems",
             middle_initial: "A",
             last_name: "Smith"
           } = Repo.one(from(e in Employee, where: e.first_name == "Nemo"))
  end
end
