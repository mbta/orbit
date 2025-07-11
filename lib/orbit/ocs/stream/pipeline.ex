defmodule Orbit.Ocs.Stream.Pipeline do
  @moduledoc """
  Maintains a connection to the Kinesis stream Producer where OCS messages are published, and passes them
  to the message handler.
  """

  use Broadway

  alias Broadway.Message
  alias Orbit.KinesisStreamState
  alias Orbit.Repo

  require Logger

  @behind_warn_threshold_ms 1_000

  def start_link(opts) do
    producer_opts = get_producer_opts(opts)

    Broadway.start_link(__MODULE__,
      name: Keyword.get(opts, :name, __MODULE__),
      producer: [
        module: {Orbit.Ocs.Stream.Producer, producer_opts},
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

    event_records =
      records
      |> Stream.flat_map(&parse_records/1)
      # |> update_ocs_sequence_monitor
      |> Stream.filter(&is_ocs_message?/1)
      |> Enum.map(&unwrap_ocs_data/1)

    Orbit.Ocs.MessageHandler.handle_messages(event_records, now)

    log_handled_events(sequence_number, ms_behind, Enum.count(event_records))

    producer_name = List.first(Broadway.producer_names(:ocs_pipeline))

    Orbit.Ocs.Stream.Producer.update_resume_position(producer_name, {
      :after_sequence_number,
      sequence_number
    })

    persist_resume_position(sequence_number, now)

    message
  end

  defp log_handled_events(sequence_number, ms_behind, records_count)
       when ms_behind >= @behind_warn_threshold_ms,
       do: log_handled_events(&Logger.warning/1, sequence_number, ms_behind, records_count)

  defp log_handled_events(sequence_number, ms_behind, records_count),
    do: log_handled_events(&Logger.info/1, sequence_number, ms_behind, records_count)

  defp log_handled_events(log_fn, sequence_number, ms_behind, records_count) do
    log_fn.([
      "Orbit.Ocs.Stream.Pipeline",
      " event=handled_events",
      " records_count=#{records_count}",
      " ms_behind=#{ms_behind}",
      " sequence_number=#{sequence_number}"
    ])
  end

  @spec parse_records(map) :: [String.t()]
  defp parse_records(%{"Data" => data}) do
    data
    |> Jason.decode!()
    |> List.wrap()
  end

  @spec is_ocs_message?(map) :: boolean()
  defp is_ocs_message?(message)

  defp is_ocs_message?(%{"type" => "com.mbta.ocs.raw_message", "data" => %{"raw" => _}}) do
    true
  end

  defp is_ocs_message?(other) do
    Logger.warning("Orbit.Ocs.Stream.Pipeline unexpected_cloud_event=#{inspect(other)}")
    false
  end

  @spec unwrap_ocs_data(map) :: String.t()
  defp unwrap_ocs_data(%{"type" => "com.mbta.ocs.raw_message", "data" => %{"raw" => message}}),
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

  # Kinesis Stream Persistence

  defp get_producer_opts(opts) do
    resume_position = load_resume_position()
    opts ++ [state: %{resume_position: resume_position}]
  end

  @spec load_resume_position() :: BroadwayKinesis.SubscribeToShard.starting_position()
  defp load_resume_position do
    # Use midnight of current service date as cutoff for determining if the
    # prior Kinesis resume position is relevant
    midnight =
      DateTime.new!(
        Util.Time.current_service_date(),
        ~T[00:00:00],
        Util.Time.current_timezone()
      )

    with stream_name when not is_nil(stream_name) <- get_stream_name(),
         stream_state when not is_nil(stream_state) <- load_stream_state(stream_name),
         false <- expired?(stream_state, midnight) do
      Logger.info("ocs_kinesis_start sequence=#{stream_state.resume_position}")

      {:after_sequence_number, stream_state.resume_position}
    else
      _ ->
        Logger.info("ocs_kinesis_start timestamp=#{midnight}")
        {:at_timestamp, midnight}
    end
  end

  @spec load_stream_state(String.t()) :: KinesisStreamState.t() | nil
  defp load_stream_state(stream_name) do
    stream_state = Repo.get_by(KinesisStreamState, stream_name: stream_name)

    if stream_state == nil do
      Logger.warning("ocs_kinesis_start stream_name=#{stream_name} : No prior sequence stored")
    end

    stream_state
  end

  @spec expired?(KinesisStreamState.t(), DateTime.t()) :: boolean()
  defp expired?(%KinesisStreamState{last_message_timestamp: timestamp}, cutoff) do
    expired = :gt == DateTime.compare(cutoff, timestamp)

    if expired do
      Logger.warning(
        "ocs_kinesis_start last_timestamp=#{timestamp} cutoff=#{cutoff} : Last timestamp is older than cutoff"
      )
    end

    expired
  end

  @spec persist_resume_position(String.t(), DateTime.t()) :: :ok
  defp persist_resume_position(resume_position, last_message_timestamp) do
    stream_name = get_stream_name()

    if stream_name != nil do
      {:ok, _} =
        %KinesisStreamState{
          stream_name: stream_name,
          resume_position: resume_position,
          last_message_timestamp: Util.Time.to_ecto_utc(last_message_timestamp)
        }
        |> KinesisStreamState.changeset()
        |> Repo.insert(
          on_conflict: :replace_all,
          conflict_target: :stream_name
        )
    end

    :ok
  end

  @spec get_stream_name() :: String.t() | nil
  defp get_stream_name do
    :orbit
    |> Application.fetch_env!(Orbit.Ocs.Stream.Producer)
    |> Keyword.get(:kinesis_stream_name)
  end
end
