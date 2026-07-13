defmodule Orbit.Import.ImportCertifications do
  use Oban.Worker, queue: :cert_import, max_attempts: 1

  alias Orbit.Certification
  alias Orbit.Import.ImportHelpers
  alias Orbit.Repo

  @impl Oban.Worker
  def perform(%Oban.Job{args: args}) do
    ImportHelpers.import_from_s3!(
      String.to_existing_atom(args["s3_ref"]),
      args["s3_path"]
    )
    |> import_csv_rows!(String.to_existing_atom(args["type"]))
  end

  @spec import_csv_rows!(Enumerable.t(), Certification.certification_type()) :: :ok
  def import_csv_rows!(file_lines, certification_type) do
    file_lines
    |> Enum.drop_while(fn line -> String.trim(line) != "" end)
    |> Enum.drop_while(fn line -> String.trim(line) == "" end)
    |> ImportHelpers.parse_csv(true)
    |> import!(certification_type)
  end

  defp parse_certification_date(date_string) do
    case DateTime.from_iso8601(date_string) do
      {:ok, datetime, _} ->
        datetime |> NaiveDateTime.to_date()

      _ ->
        # Fallback: parse manually from "M/D/YYYY h:m AM/PM" format
        case String.split(date_string, ~r/[\/\s:]/, trim: true) do
          [month, day, year, hour, minute, am_pm] ->
            hour = parse_hour(hour, am_pm)

            {:ok, date} =
              Date.new(String.to_integer(year), String.to_integer(month), String.to_integer(day))

            date

          _ ->
            raise "Invalid date format: #{date_string}"
        end
    end
  end

  defp parse_hour(hour_str, "PM"), do: String.to_integer(hour_str) + 12
  defp parse_hour("12", "AM"), do: 0
  defp parse_hour(hour_str, _), do: String.to_integer(hour_str)

  @spec import!(Enumerable.t(), Certification.certification_type()) :: :ok
  def import!(rows, certification_type) do
    Enum.map(rows, fn certification ->
      title = certification["Certifications - Certification Title"]
      expires_string = certification["Certifications - Certification Period Expiration Date"]

      expires = parse_certification_date(expires_string)

      rail_line =
        cond do
          String.ends_with?(title, "BL") ->
            :blue

          String.ends_with?(title, "OL") ->
            :orange

          String.ends_with?(title, "RL") ->
            :red

          true ->
            :none
        end

      %Certification{
        badge: String.trim_leading(certification["User - User ID"], "0"),
        type: certification_type,
        rail_line: rail_line,
        expires: expires
      }
    end)
    |> Enum.group_by(fn c -> {c.badge, c.rail_line} end)
    |> Enum.map(fn {{_badge, _rail_line}, certifications} ->
      Enum.max_by(certifications, fn certification -> certification.expires end, Date)
    end)
    |> Enum.each(
      &Repo.insert(&1,
        on_conflict: {:replace_all_except, [:id, :inserted_at]},
        conflict_target: [:badge, :type, :rail_line]
      )
    )

    :ok
  end
end
