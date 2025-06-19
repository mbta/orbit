defmodule Fake.ExAws.S3 do
  def download_file(_bucket, path, _filename) do
    %ExAws.Operation.S3{
      path: path
    }
  end
end

defmodule Fake.ExAws.Operation do
  def perform(
        %ExAws.Operation.S3{
          path: "bad_filename"
        },
        _opts
      ) do
    {:error, "test error"}
  end

  def perform(_dl, _opts) do
  end
end

defmodule Fake.ExAws do
  def request(op, opts \\ [])

  def request(
        %ExAws.Operation.JSON{
          data: %{"PartitionKey" => @bad_partition_key}
        },
        _opts
      ) do
    {:error, {"yippie", "yippie ki-yay"}}
  end

  def request(
        %ExAws.Operation.JSON{},
        _opts
      ) do
    {:ok, %{"SequenceNumber" => "123", "ShardId" => "456"}}
  end

  def request(_op, _opts) do
  end
end
