defmodule Orbit.Ocs.Stream.Producer do
  @moduledoc """
  Maintains a connection to the Kinesis stream where OCS messages are published, and passes them
  to the StreamConsumer.
  """

  use BroadwayKinesis.Producer,
    consumer_arn:
      Application.fetch_env!(:orbit, Orbit.Ocs.Stream.Producer)
      |> Keyword.get(:kinesis_consumer_arn),
    stream_name:
      Application.fetch_env!(:orbit, Orbit.Ocs.Stream.Producer)
      |> Keyword.get(:kinesis_stream_name)

  # State Persistence

  @spec load_persistent_state() :: map() | nil
  def load_persistent_state do
    stream_name =
      :orbit
      |> Application.fetch_env!(Orbit.Ocs.Stream.Producer)
      |> Keyword.get(:kinesis_stream_name)

    stream_state = Orbit.KinesisStreamState |> Orbit.Repo.get_by(stream_name: stream_name)

    case stream_state do
      %Orbit.KinesisStreamState{resume_position: resume_position} ->
        %{resume_position: resume_position}

      nil ->
        %{}
    end
  end
end
