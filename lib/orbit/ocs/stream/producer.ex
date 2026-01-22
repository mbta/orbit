defmodule Orbit.Ocs.Stream.Producer do
  @moduledoc """
  Maintains a connection to the Kinesis stream where OCS messages are published, and passes them
  to the StreamConsumer.
  """

  use BroadwayKinesis.Logger

  use BroadwayKinesis.Producer,
    consumer_arn:
      Application.fetch_env!(:orbit, Orbit.Ocs.Stream.Producer)
      |> Keyword.get(:kinesis_consumer_arn),
    stream_name:
      Application.fetch_env!(:orbit, Orbit.Ocs.Stream.Producer)
      |> Keyword.get(:kinesis_stream_name)
end
