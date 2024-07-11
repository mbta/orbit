defmodule Orbit.Import.RfidTest do
  alias Orbit.BadgeSerial
  alias Orbit.Employee
  use Orbit.DataCase
  alias Orbit.Import.Rfid
  alias Orbit.Import.RfidWorker
  import Orbit.Factory

  describe "worker" do
    test "downloads and parses badge serials" do
      insert(:employee, %{badge_number: "1234", badge_serials: []})

      RfidWorker.perform(%Oban.Job{})

      assert [%BadgeSerial{badge_serial: "56"}, %BadgeSerial{badge_serial: "78"}] =
               Repo.all(from(b in BadgeSerial))
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
  end
end
