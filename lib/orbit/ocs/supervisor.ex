defmodule Orbit.Ocs.Supervisor do
  @moduledoc """
  Parent supervisor for Orbit.Ocs.
  """
  use Supervisor

  def start_link(_opts) do
    Supervisor.start_link(__MODULE__, :ok)
  end

  def init(:ok) do
    children = [
      # TODO: Add the sequence monitor once we start parsing
      #   {Orbit.Ocs.Stream.SequenceMonitor, name: :ocs_sequence_monitor},
      {Orbit.Ocs.Stream.Pipeline, name: :ocs_pipeline, enable?: enable_stream_consumer?()}
      # TODO: RTR uses a GenServer here to receive the parsed messages and manage the schedule state
      #   {Orbit.Ocs.ScheduleState, name: Orbit.Ocs.ScheduleState}
    ]

    Supervisor.init(children, strategy: :one_for_one)
  end

  defp enable_stream_consumer?,
    do:
      :orbit
      |> Application.fetch_env!(Orbit.Ocs.Stream.Producer)
      |> Keyword.get(:enabled?)
end
