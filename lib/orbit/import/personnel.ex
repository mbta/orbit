defmodule Orbit.Import.Personnel do
  require Logger
  alias Orbit.Employee
  alias Orbit.Repo
  alias Orbit.S3

  @spec download() :: binary()
  def download do
    {:ok, csv_data} =
      S3.read(
        :glides_global,
        Keyword.fetch!(Application.fetch_env!(:orbit, Orbit.Import.Personnel), :pathname)
      )

    csv_data
  end

  defp empty_to_nil(str) do
    case str do
      "" -> nil
      _ -> str
    end
  end

  @area_name_field "CUSTOM_FIELD3"
  @area_value_field "CUSTOM_VALUE3"

  @spec import_rows(Enumerable.t(), MapSet.t()) :: :ok
  def import_rows(rows, areas) do
    result =
      rows
      # |> Enum.filter(fn entry ->
      #   entry[@area_name_field] == "Area" && MapSet.member?(areas, entry[@area_value_field])
      # end)
      |> Enum.map(
        &%Employee{
          first_name: &1["FIRST_NAME"],
          preferred_first: empty_to_nil(&1["PREF_FIRST_NM_SRCH"]),
          middle_initial: String.at(&1["MIDDLE_NAME"], 0),
          last_name: &1["LAST_NAME"],
          email: &1["WORK_EMAIL_ADDRESS"] |> String.downcase() |> empty_to_nil(),
          badge_number: String.trim_leading(&1["EMPLOYEE_ID"], "0"),
          area: String.to_integer(&1[@area_value_field])
        }
      )
      |> Enum.map(fn item ->
        try do
          Repo.insert(item,
            on_conflict: {:replace_all_except, [:id]},
            conflict_target: :badge_number
          )
        rescue
          Postgrex.Error -> nil
        end
      end)

    Logger.info("personnel_import count=#{length(result)}")
  end
end

defmodule Orbit.Import.PersonnelWorker do
  use Oban.Worker, queue: :personnel_import, max_attempts: 3
  alias Orbit.Import.Personnel

  @areas MapSet.new(["114"])

  @impl Oban.Worker
  @spec perform(Oban.Job.t()) :: :ok
  def perform(%Oban.Job{}) do
    csv_data =
      Personnel.download()
      |> String.splitter("\n", trim: true)

    rows = CSV.decode!(csv_data, headers: true, field_transform: &String.trim/1)
    Personnel.import_rows(rows, @areas)

    :ok
  end
end
