defmodule OCS.Supervisor do
  @moduledoc """
  Parent supervisor for OCS.
  """
  use Supervisor

  def start_link(_opts) do
    Supervisor.start_link(__MODULE__, :ok)
  end

  def init(:ok) do
    children = [
      # TODO: Add the sequence monitor once we start parsing
      #   {OCS.Stream.SequenceMonitor, name: :ocs_sequence_monitor},
      {OCS.Stream.Pipeline, name: :ocs_pipeline, enable?: enable_stream_consumer?()}
      # TODO: RTR uses a GenServer here to receive the parsed messages and manage the schedule state
      #   {OCS.ScheduleState, name: OCS.ScheduleState}
    ]

    Supervisor.init(children, strategy: :one_for_one)
  end

  defp enable_stream_consumer?, do: Application.fetch_env!(:orbit, :enable_ocs_stream_consumer?)
end
