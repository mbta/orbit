defmodule Orbit.Import.PersonnelTest do
  alias Orbit.Employee
  alias Orbit.Import.Personnel
  alias Orbit.Import.PersonnelWorker
  use Orbit.DataCase

  describe "worker" do
    test "downloads and parses employees" do
      PersonnelWorker.perform(%Oban.Job{})

      assert [
               %Employee{first_name: "Frank", last_name: "Sprague"},
               %Employee{first_name: "Robert", last_name: "Sprague"}
             ] =
               Repo.all(from(e in Employee))
    end
  end

  describe "import_rows" do
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
               email: "nemo@mbta.com",
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
        "FIRST_NAME" => "Nemo",
        "PREF_FIRST_NM_SRCH" => "Neems",
        "MIDDLE_NAME" => "A",
        "WORK_EMAIL_ADDRESS" => "",
        "LAST_NAME" => "Smith",
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
               last_name: "Smith",
               email: nil
             } = Repo.one(from(e in Employee, where: e.first_name == "Nemo"))
    end

    test "properly formats empty preferred name" do
      Personnel.import_rows(
        [
          %{
            "FIRST_NAME" => "Nemo",
            "PREF_FIRST_NM_SRCH" => "",
            "MIDDLE_NAME" => "A",
            "WORK_EMAIL_ADDRESS" => "",
            "LAST_NAME" => "Smith",
            "EMPLOYEE_ID" => "0123456",
            "CUSTOM_FIELD3" => "Area",
            "CUSTOM_VALUE3" => "114"
          }
        ],
        MapSet.new(["114"])
      )

      assert %Employee{
               preferred_first: nil
             } = Repo.one(from(e in Employee, where: e.first_name == "Nemo"))
    end
  end
end
