defmodule Orbit.Import.Rfid do
  require Logger
  alias Orbit.Employee
  alias Orbit.Repo
  alias Orbit.S3

  @spec download() :: binary()
  def download do
    {:ok, csv_data} =
      S3.read(
        :glides_global,
        Keyword.fetch!(Application.fetch_env!(:orbit, Orbit.Import.Rfid), :pathname)
      )

    csv_data
  end

  @badge_number_field "EMPLOYEE_ID"
  @badge_serial_field "SERIAL_NUMBER"

  @spec import_rows(Enumerable.t()) :: :ok
  def import_rows(rows) do
    imported_count =
      rows
      |> Enum.group_by(& &1[@badge_number_field])
      |> Enum.reduce(
        0,
        fn {badge_number, badge_serials}, acc ->
          count =
            case Repo.get_by(Employee, badge_number: badge_number) do
              nil ->
                0

              employee ->
                {:ok, employee} =
                  employee
                  |> Repo.preload([:badge_serials])
                  |> Employee.changeset(%{
                    badge_serials:
                      Enum.map(badge_serials, &%{badge_serial: &1[@badge_serial_field]})
                  })
                  |> Repo.update()

                length(employee.badge_serials)
            end

          acc + count
        end
      )

    Logger.info("rfid_import count=#{imported_count}")
  end
end

defmodule Orbit.Import.RfidWorker do
  use Oban.Worker, queue: :rfid_import, max_attempts: 3
  alias Orbit.Import.Rfid

  @impl Oban.Worker
  @spec perform(Oban.Job.t()) :: :ok
  def perform(%Oban.Job{}) do
    Rfid.download()
    |> String.splitter("\n", trim: true)
    |> CSV.decode!(headers: true, field_transform: &String.trim/1)
    |> Rfid.import_rows()

    :ok
  end
end
