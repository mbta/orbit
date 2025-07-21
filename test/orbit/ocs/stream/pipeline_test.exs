defmodule Orbit.Ocs.Stream.PipelineTest do
  use Orbit.DataCase

  import Mock

  alias Orbit.KinesisStreamState
  alias Orbit.Ocs.MessageHandler
  alias Orbit.Ocs.Stream.Pipeline
  alias Orbit.Ocs.Stream.Producer
  alias Orbit.Repo

  @test_timezone Application.compile_env(:orbit, :timezone)
  @test_service_date Date.new!(2025, 7, 2)
  @test_service_date_midnight DateTime.new!(
                                @test_service_date,
                                ~T[00:00:00],
                                @test_timezone
                              )
  @test_datetime_utc DateTime.from_iso8601("2025-07-02T20:48:00Z") |> elem(1)

  @test_old_datetime_utc DateTime.from_iso8601("2025-07-01T20:48:00Z") |> elem(1)
  @test_stream_name "test-stream-name"

  setup_with_mocks([
    {Broadway, [],
     [
       start_link: fn _mod, _opts -> :ignore end,
       producer_names: fn _broadway_name -> [self()] end
     ]},
    {MessageHandler, [],
     [
       handle_messages: fn _records, _datetime -> :ok end
     ]},
    {Util.Time, [:passthrough], [current_service_date: fn -> @test_service_date end]}
  ]) do
    :ok
  end

  describe "start_link" do
    test "initializes producer to resume from current service date, if no sequence is stored" do
      Pipeline.start_link(name: :ocs_pipeline, enable?: false)

      assert_called(
        Elixir.Broadway.start_link(
          Pipeline,
          :meck.is(fn opts ->
            assert opts[:name] == :ocs_pipeline
            {Producer, producer_opts} = opts[:producer][:module]
            %{resume_position: resume_position} = producer_opts[:state]
            assert resume_position == {:at_timestamp, @test_service_date_midnight}

            true
          end)
        )
      )
    end

    test "initializes producer with persisted resume position, if still relevant" do
      %KinesisStreamState{
        stream_name: @test_stream_name,
        resume_position: "12345",
        last_message_timestamp: @test_datetime_utc
      }
      |> KinesisStreamState.changeset()
      |> Repo.insert()

      Pipeline.start_link(name: :ocs_pipeline, enable?: false)

      assert_called(
        Elixir.Broadway.start_link(
          Pipeline,
          :meck.is(fn opts ->
            assert opts[:name] == :ocs_pipeline
            {Producer, producer_opts} = opts[:producer][:module]
            %{resume_position: resume_position} = producer_opts[:state]
            assert resume_position == {:after_sequence_number, "12345"}
          end)
        )
      )
    end

    test "initializes producer to resume from current service date, if stored sequence is stale" do
      %KinesisStreamState{
        stream_name: @test_stream_name,
        resume_position: "12345",
        last_message_timestamp: @test_old_datetime_utc
      }
      |> KinesisStreamState.changeset()
      |> Repo.insert()

      Pipeline.start_link(name: :ocs_pipeline, enable?: false)

      assert_called(
        Elixir.Broadway.start_link(
          Pipeline,
          :meck.is(fn opts ->
            assert opts[:name] == :ocs_pipeline
            {Producer, producer_opts} = opts[:producer][:module]
            %{resume_position: resume_position} = producer_opts[:state]
            assert resume_position == {:at_timestamp, @test_service_date_midnight}

            true
          end)
        )
      )
    end
  end

  @test_kinesis_event %{
    data: %{
      "ContinuationSequenceNumber" => "67890",
      "MillisBehindLatest" => 0,
      "Records" => [
        %{
          "Data" =>
            ~S({"type": "com.mbta.ocs.raw_message", "data": {"raw": "raw_content_1"}, "time": "2025-07-02T20:48:00Z"})
        },
        %{
          "Data" =>
            ~S({"type": "com.mbta.ocs.raw_message", "data": {"raw": "raw_content_2"}, "time": "2025-07-02T20:48:00Z"})
        },
        %{
          "Data" => ~S({"type": "some.other.event_type", "time": "2025-07-02T20:48:00Z"})
        }
      ]
    }
  }

  describe "handle_message" do
    test "sends records to message handler" do
      Pipeline.handle_message(:fake, @test_kinesis_event, :fake)

      assert_called(
        MessageHandler.handle_messages(
          [
            %{raw_message: "raw_content_1", event_time: @test_datetime_utc},
            %{raw_message: "raw_content_2", event_time: @test_datetime_utc}
          ],
          # ignore datetime param
          :_
        )
      )
    end

    test "notifies producer of updated kinesis resume position" do
      Pipeline.handle_message(:fake, @test_kinesis_event, :fake)

      # Test module sets itself as the producer pid
      assert_receive {:resume_position_update, {:after_sequence_number, "67890"}}
    end

    test "writes kinesis resume position to DB" do
      Pipeline.handle_message(:fake, @test_kinesis_event, :fake)

      stream_state = KinesisStreamState |> Repo.get_by(stream_name: @test_stream_name)
      assert %KinesisStreamState{resume_position: "67890"} = stream_state
    end
  end
end
