defmodule Orbit.Import.ImportHelpers do
  @spec parse_csv(Enumerable.t(), [atom()] | boolean(), keyword()) :: Enumerable.t()
  def parse_csv(file_lines, headers, options \\ []) do
    file_lines
    |> Stream.drop(
      if headers == true do
        0
      else
        1
      end
    )
    |> Stream.map(fn line ->
      if String.ends_with?(line, "\n") do
        line
      else
        "#{line}\n"
      end
    end)
    |> CSV.decode!(
      options ++ [headers: headers, field_transform: &String.trim/1, validate_row_length: true]
    )
  end

  @doc """
  Read the csv from the path
  """
  @spec import_from_file!(String.t()) :: File.Stream.t()
  def import_from_file!(file_path) do
    file_path
    |> File.stream!()
  end

  @doc """
  Read the csv from the `:glides` S3 ref in the given path, and pass it to the provided importer
  """
  @spec import_from_s3!(Orbit.S3.s3_ref(), String.t()) :: Enumerable.t()
  def import_from_s3!(s3_ref, s3_path) do
    {:ok, file_data} = Orbit.S3.read(s3_ref, s3_path)

    file_data
    |> String.splitter("\n", trim: true)
  end
end
