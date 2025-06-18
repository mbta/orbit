defmodule OCS.Stream.Pipeline do
  @moduledoc """
  Maintains a connection to the Kinesis stream Producer where OCS messages are published, and passes them
  to the message handler.
  """

  use Broadway

  alias Broadway.Message
  # alias OCS.Stream.SequenceMonitor

  require Logger
  # require OCS.MessageHandler

  @ms_behind_warn_threshold 1_000

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
  def handle_message(_, message, _) do
    now = Util.Time.current_datetime()

    %{
      "ContinuationSequenceNumber" => sequence_number,
      "MillisBehindLatest" => ms_behind,
      "Records" => records
    } = message.data

    {ocs_mod, ocs_func, ocs_args} = Application.fetch_env!(:orbit, :handle_ocs_message)

    event_records_count =
      records
      |> Enum.flat_map(&parse_records/1)
      # |> update_ocs_sequence_monitor
      |> Enum.map(&ocs_message/1)
      |> Enum.map(&apply(ocs_mod, ocs_func, [&1, now] ++ ocs_args))
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
       when ms_behind >= @ms_behind_warn_threshold,
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

  defp log(message), do: Logger.info(["OCS.Stream.Pipeline " | message])
  defp warn(message), do: Logger.warning(["OCS.Stream.Pipeline " | message])
end
