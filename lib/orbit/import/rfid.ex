defmodule Orbit.Import.Rfid do
  require Logger
  import Ecto.Query
  alias Orbit.BadgeSerial
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
    rows =
      rows
      |> Enum.map(fn row ->
        Map.update!(row, @badge_number_field, &String.trim_leading(&1, "0"))
      end)

    num_serials_with_duplicates =
      rows
      |> Enum.frequencies_by(& &1[@badge_serial_field])
      |> Enum.count(fn {_serial, count} -> count > 1 end)

    if num_serials_with_duplicates > 0 do
      Logger.warning("rfid_import badge_serials_with_duplicates=#{num_serials_with_duplicates}")
    end

    serials_by_badge =
      Enum.group_by(rows, & &1[@badge_number_field], & &1[@badge_serial_field])

    {:ok, imported_count} =
      Repo.transaction(
        fn ->
          for {badge_number, badge_serials} <- serials_by_badge, reduce: 0 do
            acc ->
              case Repo.get_by(Employee, badge_number: badge_number) do
                nil ->
                  acc

                employee ->
                  employee_id = employee.id
                  # Delete any of this employee's badges that were not in the latest import.
                  Repo.delete_all(
                    from(b in BadgeSerial,
                      where: b.employee_id == ^employee_id,
                      where: b.badge_serial not in ^badge_serials
                    )
                  )

                  # And add any new badges for that employee
                  for b <- badge_serials do
                    %BadgeSerial{employee_id: employee_id, badge_serial: b}
                    |> BadgeSerial.changeset()
                    |> Repo.insert(
                      on_conflict: {:replace_all_except, [:id, :inserted_at]},
                      conflict_target: :badge_serial
                    )
                  end

                  acc + length(badge_serials)
              end
          end
        end,
        timeout: 120_000
      )

    Logger.info("rfid_import count=#{imported_count}")
  end
end

defmodule Orbit.Import.RfidWorker do
  require Logger
  use Oban.Worker, queue: :rfid_import, max_attempts: 3
  alias Orbit.Import.Rfid

  @impl Oban.Worker
  @spec perform(Oban.Job.t()) :: :ok
  def perform(%Oban.Job{}) do
    try do
      Rfid.download()
      |> String.splitter("\n", trim: true)
      |> CSV.decode!(headers: true, field_transform: &String.trim/1)
      |> Rfid.import_rows()
    rescue
      error -> Logger.error(inspect(error))
    end

    :ok
  end
end
