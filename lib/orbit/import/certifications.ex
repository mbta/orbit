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

  @spec import!(Enumerable.t(), Certification.certification_type()) :: :ok
  def import!(rows, certification_type) do
    Enum.map(rows, fn certification ->
      title = certification["Certifications - Certification Title"]
      expires_string = certification["Certifications - Certification Period Expiration Date"]

      expires =
        expires_string |> Timex.parse!("{M}/{D}/{YYYY} {h12}:{m} {AM}") |> NaiveDateTime.to_date()

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
