defmodule Orbit.PersistentState.S3.LocalDebugFile do
  @moduledoc "Write body and S3 Request to a file for debugging"

  @spec request(ExAws.Operation.t()) :: {:ok, term}
  def request(%{body: body, path: path} = req) do
    output_path = add_timestamp(path, Application.get_env(:orbit, :include_timestamps?) == "true")

    dir =
      :orbit
      |> Application.get_env(:s3_output_directory)
      |> Path.join(output_path)
      |> Path.dirname()

    file = Path.basename(output_path)
    File.mkdir_p!(dir)
    File.write!(Path.join(dir, file), body)
    {:ok, req}
  end

  @doc "Adds a timestamp to the filename if given true value"
  @spec add_timestamp(String.t(), boolean) :: String.t()
  def add_timestamp(path, false), do: path

  def add_timestamp(path, true) do
    timestamp = System.system_time(:second)
    new_suffix = "-#{timestamp}.pb"
    String.replace_suffix(path, ".pb", new_suffix)
  end
end

defmodule Orbit.PersistentState.S3.Test do
  @moduledoc "Let the test process know we got the request, but do nothing"

  @spec request(ExAws.Operation.t()) :: {:ok, term}
  def request(%ExAws.S3.Upload{
        path: "20170429.tar.gz"
      }) do
    {:error, "error"}
  end

  def request(%ExAws.Operation.S3{
        path: "bad_filename"
      }) do
    send(self(), :s3_request_bad_file)

    {:error, "error"}
  end

  def request(req) do
    send(self(), :s3_request)
    {:ok, req}
  end
end
