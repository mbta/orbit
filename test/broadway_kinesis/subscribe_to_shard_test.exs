defmodule BroadwayKinesis.SubscribeToShardTest do
  use ExUnit.Case, async: true
  require BroadwayKinesis.SubscribeToShard
  alias FakeKinesis, as: Kinesis
  alias Plug.Conn

  defmodule TestConsumer do
    @moduledoc """
    Minimal consumer for `SubscribeToShard` that forwards all events and errors returned from
    `stream/2` to the test process as messages. Overrides the Kinesis URL to point to a provided
    Bypass instance.
    """

    use GenServer

    def subscribe(bypass), do: subscribe(bypass, "arn:test", "shard0", :latest)

    def subscribe(bypass, starting_position),
      do: subscribe(bypass, "arn:test", "shard0", starting_position)

    def subscribe(bypass, consumer_arn, shard_id, starting_position) do
      start_supervised(
        {__MODULE__, {self(), consumer_arn, shard_id, starting_position, bypass}},
        restart: :temporary
      )
    end

    def start_link(args), do: GenServer.start_link(__MODULE__, args)

    def init({test_pid, consumer_arn, shard_id, starting_position, bypass}) do
      result =
        BroadwayKinesis.SubscribeToShard.subscribe(
          consumer_arn,
          shard_id,
          starting_position,
          build_url_fn: fn _operation, _config -> "http://localhost:#{bypass.port}/" end
        )

      case result do
        {:ok, state} -> {:ok, {test_pid, state}}
        {:error, error} -> {:stop, error}
      end
    end

    def handle_info(message, {test_pid, state})
        when BroadwayKinesis.SubscribeToShard.is_message(state, message) do
      case BroadwayKinesis.SubscribeToShard.stream(state, message) do
        {:ok, new_state, events} ->
          for event <- events, do: send(test_pid, {:event, event})
          {:noreply, {test_pid, new_state}}

        {:error, error, events} ->
          for event <- events, do: send(test_pid, {:event, event})
          send(test_pid, {:error, error})
          {:stop, :normal, {test_pid, state}}
      end
    end
  end

  defp get_header(headers, key), do: :proplists.get_value(key, headers)

  setup do
    bypass = Bypass.open()
    {:ok, bypass: bypass}
  end

  describe "request handling" do
    test "has the correct request headers and body", %{bypass: bypass} do
      Kinesis.expect_once(bypass, fn %{req_headers: headers} = conn ->
        {:ok, body, conn} = Conn.read_body(conn)

        expected_body = %{
          "ConsumerARN" => "test-arn",
          "ShardId" => "test-shard",
          "StartingPosition" => %{"Type" => "LATEST"}
        }

        assert Jason.decode!(body) == expected_body
        assert get_header(headers, "x-amz-target") == "Kinesis_20131202.SubscribeToShard"
        assert get_header(headers, "content-type") == "application/x-amz-json-1.1"
        assert get_header(headers, "authorization") =~ ~r/^AWS4-HMAC-SHA256/

        Conn.send_resp(conn, 503, "")
      end)

      {:ok, _} = TestConsumer.subscribe(bypass, "test-arn", "test-shard", :latest)

      assert_receive {:error, {:http_error, 503, _}}
    end

    @starting_positions [
      {:latest, %{"Type" => "LATEST"}},
      {:trim_horizon, %{"Type" => "TRIM_HORIZON"}},
      {{:at_sequence_number, "123"},
       %{"Type" => "AT_SEQUENCE_NUMBER", "SequenceNumber" => "123"}},
      {{:after_sequence_number, "456"},
       %{"Type" => "AFTER_SEQUENCE_NUMBER", "SequenceNumber" => "456"}},
      {{:at_timestamp, ~U[2021-01-01 12:34:56Z]},
       %{"Type" => "AT_TIMESTAMP", "Timestamp" => "2021-01-01T12:34:56Z"}}
    ]

    test "encodes starting positions correctly" do
      for {starting_position, expected_params} <- @starting_positions do
        bypass = Bypass.open()

        Kinesis.expect_once(bypass, fn conn ->
          {:ok, body, conn} = Conn.read_body(conn)
          assert %{"StartingPosition" => ^expected_params} = Jason.decode!(body)
          Conn.send_resp(conn, 503, "")
        end)

        {:ok, _} = TestConsumer.subscribe(bypass, starting_position)

        assert_receive {:error, {:http_error, 503, _}}
      end
    end

    test "errors when unable to connect to the server", %{bypass: bypass} do
      Bypass.down(bypass)

      {:error, {error, _}} = TestConsumer.subscribe(bypass)

      assert error == %Mint.TransportError{reason: :econnrefused}
    end
  end

  describe "streaming" do
    test "streams SubscribeToShardEvent messages", %{bypass: bypass} do
      Kinesis.expect(bypass, fn conn ->
        Kinesis.stream(conn, [
          Kinesis.encode_event(%{"ContinuationSequenceNumber" => "1"}),
          Kinesis.encode_event(%{"ContinuationSequenceNumber" => "2"}),
          Kinesis.encode_event(%{"ContinuationSequenceNumber" => nil})
        ])
      end)

      {:ok, _} = TestConsumer.subscribe(bypass)

      assert_receive {:event, %{"ContinuationSequenceNumber" => "1"}}
      assert_receive {:event, %{"ContinuationSequenceNumber" => "2"}}
      assert_receive {:event, %{"ContinuationSequenceNumber" => nil}}
      assert_receive {:error, :closed}
    end

    test "re-requests with sequence number when the request is closed", %{bypass: bypass} do
      Kinesis.expect(bypass, fn conn ->
        {:ok, body, conn} = Conn.read_body(conn)

        case Jason.decode!(body)["StartingPosition"] do
          %{"Type" => "LATEST"} ->
            Kinesis.stream(conn, [Kinesis.encode_event(%{"ContinuationSequenceNumber" => "3"})])

          %{"Type" => "AFTER_SEQUENCE_NUMBER", "SequenceNumber" => "3"} ->
            Kinesis.stream(conn, [Kinesis.encode_event(%{"ContinuationSequenceNumber" => "5"})])

          %{"Type" => "AFTER_SEQUENCE_NUMBER", "SequenceNumber" => "5"} ->
            Conn.send_resp(conn, 503, "")
        end
      end)

      {:ok, _} = TestConsumer.subscribe(bypass)

      assert_receive {:event, %{"ContinuationSequenceNumber" => "3"}}
      assert_receive {:event, %{"ContinuationSequenceNumber" => "5"}}
      assert_receive {:error, {:http_error, 503, _}}
    end

    # NOTE: This test may occasionally fail with the reason "** (exit) shutdown", due to a bug in
    # Bypass[1]. All other tests send an error or "closed" event on the final expected request so
    # `SubscribeToShard` doesn't attempt to reconnect while the test is exiting, which is the
    # behavior that triggers the bug. But in this case, there is no way to know which request is
    # the "final" one, due to the request parameters being identical and Bypass not supporting
    # multiple stubs/expects on the same route.
    # [1] https://github.com/PSPDFKit-labs/bypass/issues/120
    test "re-requests with original starting position if no events received", %{bypass: bypass} do
      test_pid = self()

      Kinesis.expect(bypass, fn conn ->
        {:ok, body, conn} = Conn.read_body(conn)
        assert Jason.decode!(body)["StartingPosition"] == %{"Type" => "TRIM_HORIZON"}
        send(test_pid, :asserted)
        Kinesis.stream(conn, [])
      end)

      {:ok, _} = TestConsumer.subscribe(bypass, :trim_horizon)

      assert_receive :asserted
      assert_receive :asserted
    end

    test "errors when an exception event is received", %{bypass: bypass} do
      Kinesis.expect_once(bypass, fn conn ->
        Kinesis.stream(conn, [
          Kinesis.encode_event(%{"ContinuationSequenceNumber" => "1"}),
          Kinesis.encode_exception("ResourceInUseException", "Another active subscription...")
        ])
      end)

      {:ok, _} = TestConsumer.subscribe(bypass)

      assert_receive {:event, %{"ContinuationSequenceNumber" => "1"}}
      assert_receive {:error, {"ResourceInUseException", "Another active subscription..."}}
    end

    test "errors when the shard is closed", %{bypass: bypass} do
      Kinesis.expect_once(bypass, fn conn ->
        Kinesis.stream(conn, [
          Kinesis.encode_event(%{"ContinuationSequenceNumber" => "999"}),
          Kinesis.encode_event(%{"ContinuationSequenceNumber" => nil})
        ])
      end)

      {:ok, _} = TestConsumer.subscribe(bypass)

      assert_receive {:event, %{"ContinuationSequenceNumber" => "999"}}
      assert_receive {:event, %{"ContinuationSequenceNumber" => nil}}
      assert_receive {:error, :closed}
    end

    test "handles events too large for a single HTTP2 data frame", %{bypass: bypass} do
      # 1MB is the maximum size of the data in a Kinesis record, before base64 encoding
      # (maximum HTTP2 data frame size is 16KB unless the receiver specifies otherwise)
      data =
        Enum.reduce(0..1_048_576, [], fn _, acc -> [:rand.uniform(256) - 1 | acc] end)
        |> IO.iodata_to_binary()
        |> Base.encode64()

      Kinesis.expect_once(bypass, fn conn ->
        Kinesis.stream(conn, [
          Kinesis.encode_event(%{"ContinuationSequenceNumber" => "1"}),
          Kinesis.encode_event(%{
            "ContinuationSequenceNumber" => "2",
            "Records" => [%{"Data" => data}]
          }),
          Kinesis.encode_event(%{"ContinuationSequenceNumber" => nil})
        ])
      end)

      {:ok, _} = TestConsumer.subscribe(bypass)

      assert_receive {:event, %{"ContinuationSequenceNumber" => "1"}}
      assert_receive {:event, %{"ContinuationSequenceNumber" => "2"}}, 1_000
      assert_receive {:event, %{"ContinuationSequenceNumber" => nil}}
      assert_receive {:error, :closed}
    end
  end

  describe "response handling" do
    test "errors when the initial response is a redirect", %{bypass: bypass} do
      Kinesis.expect_once(bypass, fn conn ->
        conn
        |> Conn.put_resp_header("location", "http://example.com")
        |> Conn.send_resp(301, "")
      end)

      {:ok, _} = TestConsumer.subscribe(bypass)

      assert_receive {:error, {:http_error, 301, "http://example.com"}}
    end

    test "errors when the initial response is an exception", %{bypass: bypass} do
      response =
        Jason.encode!(%{
          "__type" => "ResourceNotFoundException",
          "message" => "The requested resource..."
        })

      Kinesis.expect_once(bypass, &Kinesis.respond(&1, 400, response))

      {:ok, _} = TestConsumer.subscribe(bypass)

      assert_receive {:error, {"ResourceNotFoundException", "The requested resource..."}}
    end

    test "errors when the initial response is a server error", %{bypass: bypass} do
      Kinesis.expect_once(bypass, &Kinesis.respond(&1, 503, "the system is down"))

      {:ok, _} = TestConsumer.subscribe(bypass)

      assert_receive {:error, {:http_error, 503, "the system is down"}}
    end
  end
end
