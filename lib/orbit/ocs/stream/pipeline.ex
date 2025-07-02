defmodule Orbit.Ocs.Stream.Pipeline do
  @moduledoc """
  Maintains a connection to the Kinesis stream Producer where OCS messages are published, and passes them
  to the message handler.
  """

  use Broadway

  alias Broadway.Message
  # alias Orbit.Ocs.Stream.SequenceMonitor

  require Logger
  # require Orbit.Ocs.MessageHandler

  @behind_warn_threshold_ms 1_000

  def start_link(opts) do
    Broadway.start_link(__MODULE__,
      name: Keyword.get(opts, :name, __MODULE__),
      producer: [
        module: {Orbit.Ocs.Stream.Producer, opts},
        transformer: {__MODULE__, :transform, opts},
        concurrency: 1
      ],
      processors: [
        default: [concurrency: 1, max_demand: 1]
      ]
    )
  end

  @impl Broadway
  def handle_message(_processor, message, _context) do
    now = Util.Time.current_datetime()

    %{
      "ContinuationSequenceNumber" => sequence_number,
      "MillisBehindLatest" => ms_behind,
      "Records" => records
    } = message.data

    event_records_count =
      records
      |> Enum.flat_map(&parse_records/1)
      # |> update_ocs_sequence_monitor
      |> Enum.map(&ocs_message/1)
      |> Enum.map(&Orbit.Ocs.MessageHandler.receive(&1, now))
      |> Enum.count()

    log_handled_events(sequence_number, ms_behind, event_records_count)
    producer_name = List.first(Broadway.producer_names(:ocs_pipeline))
    Kernel.send(producer_name, {:resume_position_update, sequence_number})
    message
  end

  # TODO
  # defp update_ocs_sequence_monitor(records) do
  #   SequenceMonitor.update_ocs_records(records)
  #   records
  # end

  defp log_handled_events(sequence_number, ms_behind, records_count)
       when ms_behind >= @behind_warn_threshold_ms,
       do: log_handled_events(&warn/1, sequence_number, ms_behind, records_count)

  defp log_handled_events(sequence_number, ms_behind, records_count),
    do: log_handled_events(&log/1, sequence_number, ms_behind, records_count)

  defp log_handled_events(log_fn, sequence_number, ms_behind, records_count) do
    log_fn.([
      "event=handled_events records_count=",
      Integer.to_string(records_count),
      " ms_behind=",
      Integer.to_string(ms_behind),
      " sequence_number=",
      sequence_number
    ])
  end

  @spec parse_records(map) :: [String.t()]
  defp parse_records(%{"Data" => data}) do
    data
    |> Jason.decode!()
    |> List.wrap()
  end

  @spec ocs_message(map) :: String.t()
  defp ocs_message(%{"type" => "com.mbta.ocs.raw_message", "data" => %{"raw" => message}}),
    do: message

  def transform(event, opts) do
    %Message{
      data: event,
      acknowledger:
        if ack = opts[:ack] do
          ack
        else
          {__MODULE__, :ack_id, :ack_data}
        end
    }
  end

  def ack(:ack_id, _successful, _failed) do
    # This is required per the framework, but could be useful down the line
    # to track which messages actually make it all the way into state.
  end

  defp log(message), do: Logger.info(["Orbit.Ocs.Stream.Pipeline " | message])
  defp warn(message), do: Logger.warning(["Orbit.Ocs.Stream.Pipeline " | message])
end
