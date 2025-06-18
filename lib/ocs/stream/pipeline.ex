defmodule OCS.Stream.Pipeline do
  @moduledoc """
  Maintains a connection to the Kinesis stream Producer where OCS messages are published, and passes them
  to the message handler.
  """

  use Broadway

  alias Broadway.Message

  require Logger

  def start_link(opts) do
    Broadway.start_link(__MODULE__,
      name: Keyword.get(opts, :name, __MODULE__),
      producer: [
        module: {OCS.Stream.Producer, opts},
        transformer: {__MODULE__, :transform, []},
        concurrency: 1
      ],
      processors: [
        default: [concurrency: 1, max_demand: 1]
      ]
    )
  end

  @impl true
  @spec handle_message(any(), any(), any()) :: any()
  def handle_message(_, message, _) do
    Logger.debug("#{__MODULE__} ocs raw message: #{inspect(message)}")
    message
  end

  def transform(event, _opts) do
    %Message{
      data: event,
      acknowledger: {__MODULE__, :ack_id, :ack_data}
    }
  end

  def ack(:ack_id, _successful, _failed) do
    # This is required per the framework, but could be useful down the line
    # to track which messages actually make it all the way into state.
  end
end
