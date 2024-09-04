defmodule Orbit.Import.RfidTest do
  use Orbit.DataCase
  import Orbit.Factory
  import Test.Support.Helpers
  alias Orbit.BadgeSerial
  alias Orbit.Employee
  alias Orbit.Import.Rfid
  alias Orbit.Import.RfidWorker

  describe "worker" do
    test "downloads and parses badge serials" do
      insert(:employee, %{badge_number: "123456", badge_serials: []})

      RfidWorker.perform(%Oban.Job{})

      badge_serials = Repo.all(from(b in BadgeSerial))

      assert [%BadgeSerial{badge_serial: "78"}, %BadgeSerial{badge_serial: "90"}] =
               Enum.sort_by(badge_serials, & &1.badge_serial)
    end
  end

  describe "import_rows" do
    test "imports multiple badge serials for an operator" do
      employee_id = "1234"

      insert(:employee, %{badge_number: employee_id, badge_serials: []})

      rows = [
        %{"EMPLOYEE_ID" => employee_id, "SERIAL_NUMBER" => "56"},
        %{"EMPLOYEE_ID" => employee_id, "SERIAL_NUMBER" => "78"}
      ]

      Rfid.import_rows(rows)

      assert %Employee{
               badge_number: ^employee_id,
               badge_serials: badge_serials
             } =
               Employee
               |> Repo.get_by(badge_number: employee_id)
               |> Repo.preload([:badge_serials])

      assert [%BadgeSerial{badge_serial: "56"}, %BadgeSerial{badge_serial: "78"}] =
               Enum.sort_by(badge_serials, & &1.badge_serial)
    end

    test "ignores badge serial data for employees not in the database" do
      employee_id1 = "1234"
      employee_id2 = "5678"

      insert(:employee, %{badge_number: employee_id1, badge_serials: []})

      rows = [
        %{"EMPLOYEE_ID" => employee_id2, "SERIAL_NUMBER" => "56"},
        %{"EMPLOYEE_ID" => employee_id2, "SERIAL_NUMBER" => "78"}
      ]

      Rfid.import_rows(rows)

      assert %Employee{
               badge_number: ^employee_id1,
               badge_serials: []
             } =
               Employee
               |> Repo.get_by(badge_number: employee_id1)
               |> Repo.preload([:badge_serials])

      assert [] =
               Repo.all(from(b in BadgeSerial))
    end

    test "trims any leading zeros from badge number" do
      employee_id = "1234"

      insert(:employee, %{badge_number: employee_id, badge_serials: []})

      rows = [
        %{"EMPLOYEE_ID" => "0#{employee_id}", "SERIAL_NUMBER" => "56"}
      ]

      Rfid.import_rows(rows)

      assert %Employee{
               badge_number: ^employee_id,
               badge_serials: [%BadgeSerial{badge_serial: "56"}]
             } =
               Employee
               |> Repo.get_by(badge_number: employee_id)
               |> Repo.preload([:badge_serials])
    end

    test "overwrites existing badge for employee and employee for badge" do
      insert(:employee,
        badge_number: "100",
        badge_serials: [build(:badge_serial, badge_serial: "1000")]
      )

      insert(:employee,
        badge_number: "101",
        badge_serials: [build(:badge_serial, badge_serial: "1001")]
      )

      rows = [
        %{"EMPLOYEE_ID" => "100", "SERIAL_NUMBER" => "1001"}
      ]

      Rfid.import_rows(rows)

      assert [
               %Employee{
                 badge_number: "100",
                 badge_serials: [%BadgeSerial{badge_serial: "1001"}]
               },
               %Employee{
                 badge_number: "101",
                 badge_serials: []
               }
             ] =
               Employee
               |> Repo.all()
               |> Repo.preload([:badge_serials])
               |> Enum.sort_by(& &1.badge_number)
    end

    test "logs warning if serial number is duplicated in file" do
      insert(:employee, badge_number: "100")
      insert(:employee, badge_number: "101")

      rows = [
        %{"EMPLOYEE_ID" => "100", "SERIAL_NUMBER" => "1000"},
        %{"EMPLOYEE_ID" => "101", "SERIAL_NUMBER" => "1000"}
      ]

      log =
        capture_log do
          Rfid.import_rows(rows)
        end

      assert Enum.member?(log, "[warning] rfid_import badge_serials_with_duplicates=1")

      # serial might be assigned to either employee
      assert [%BadgeSerial{employee_id: _, badge_serial: "1000"}] = Repo.all(BadgeSerial)
    end
  end
end
