defmodule BroadwayKinesis.SubscribeToShard do
  @moduledoc """
  Client for the AWS Kinesis `SubscribeToShard` API, using `ExAws` for configuration. Uses a
  process-less streaming model similar to (and implemented using) the Mint HTTP library.

  Notable limitations:
    * Cannot stream from multiple shards over the same connection
    * Does not transparently handle shard splits and merges
    * Does not implement the automatic backoff-and-retry feature of `ExAws`; calls fail
      immediately if e.g. a `LimitExceededException` is received

  Known issues:
    * When an error occurs and the connection is open, it is closed internally and the state is
      immediately discarded, even though a "closing" connection can still generate messages. This
      is a shortcut to simplify error handling, and is currently acceptable because the only user
      of this module is a supervised GenServer that crashes on any error and is restarted with a
      fresh mailbox. In other contexts, these stray messages that can't be matched to a connection
      could cause errors or "leaks" where the process mailbox grows without bound.
  """

  alias Mint.HTTP2
  require Mint.HTTP

  @content_type "application/x-amz-json-1.1"
  @target_operation "Kinesis_20131202.SubscribeToShard"

  @type t :: %__MODULE__{
          conn: HTTP2.t(),
          consumer_arn: String.t(),
          shard_id: String.t(),
          resume_position: starting_position,
          options: options,
          active?: boolean,
          status: integer | nil,
          headers: headers | nil,
          buffer: iodata,
          msg_bytes_left: integer | nil
        }

  @enforce_keys [:conn, :consumer_arn, :shard_id, :resume_position]
  defstruct @enforce_keys ++
              [
                options: [],
                active?: false,
                status: nil,
                headers: nil,
                buffer: <<>>,
                msg_bytes_left: nil
              ]

  defimpl Inspect do
    def inspect(%{consumer_arn: consumer_arn, shard_id: shard_id}, _opts) do
      "#SubscribeToShard<#{shard_id} in #{consumer_arn}>)"
    end
  end

  @type error :: ex_aws_error | mint_error | :closed
  @type event :: %{String.t() => any}
  @type options :: [build_url_fn: (ExAws.Operation.JSON.t(), ExAws.Config.t() -> String.t())]
  @type starting_position ::
          {:at_sequence_number, String.t()}
          | {:after_sequence_number, String.t()}
          | {:at_timestamp, DateTime.t()}
          | :latest
          | :trim_horizon

  @typep ex_aws_error ::
           {type :: String.t(), message :: String.t()}
           | {:http_error, status :: integer, body :: String.t()}
  @typep headers :: Mint.Types.headers()
  @typep mint_error :: Mint.Types.error()
  @typep mint_response :: Mint.Types.response()

  @doc "Guard to determine whether a message is a connection message for the given connection."
  defguard is_message(state, message)
           when is_struct(state, __MODULE__) and
                  Mint.HTTP.is_connection_message(state.conn, message)

  @doc """
  Open a streaming connection to receive events from a given Kinesis shard. If successful, returns
  an opaque data structure representing the connection state, and the calling process will begin
  receiving connection messages. Together with the state, these should be passed to `stream/2` to
  parse events and continue receiving messages.
  """
  @spec subscribe(String.t(), String.t(), starting_position, options) ::
          {:ok, t} | {:error, mint_error}
  def subscribe(consumer_arn, shard_id, starting_position, options \\ []) do
    req = build_request(consumer_arn, shard_id, starting_position, options)

    with {:ok, conn} <- connect(req), {:ok, conn} <- request(conn, req) do
      {:ok,
       %__MODULE__{
         conn: conn,
         consumer_arn: consumer_arn,
         shard_id: shard_id,
         resume_position: starting_position,
         options: options,
         active?: true
       }}
    else
      {:error, error} ->
        {:error, error}

      {:error, conn, error} ->
        {:ok, _} = HTTP2.close(conn)
        {:error, error}
    end
  end

  @doc """
  Should be called when a connection message (identified by `is_message/2`) is received, passing
  the matching connection state. Attempts to transparently reconnect to the shard using the last
  received `ContinuationSequenceNumber` if the server closes the stream without an error, e.g. if
  the subscription "time limit" runs out.

  * If successful, returns the new connection state and a list of received events (which may be
    empty), and enables the subscribed process to receive the next connection message.

  * If an error occurs, returns the error and any events that were successfully received before
    it. The connection is now closed and the state can be thrown away.

  * Returns `:unknown` if the given message is not a connection message for the given connection.

  Possible errors are `Mint.Types.error/0`, the error types returned from `ExAws.request/2`, or
  `:closed` if the shard was closed (due to a shard split or merge).
  """
  @typep stream_result :: {:ok, t, [event]} | {:error, error, [event]} | :unknown
  @spec stream(t, term) :: stream_result
  def stream(%__MODULE__{conn: conn} = state, message) when is_message(state, message) do
    conn |> HTTP2.stream(message) |> handle_stream(state)
  end

  def stream(%__MODULE__{}, _message), do: :unknown

  @spec handle_stream(
          {:ok, HTTP2.t(), [mint_response]} | {:error, HTTP2.t(), mint_error, [mint_response]},
          t
        ) :: stream_result
  defp handle_stream({:ok, conn, responses}, state) do
    handle_responses(%{state | conn: conn}, responses, :ok)
  end

  defp handle_stream({:error, conn, error, responses}, state) do
    handle_responses(%{state | conn: conn}, responses, error)
  end

  # Type of the accumulator used to keep track of the state, events parsed, and errors seen as a
  # list of Mint responses is processed
  @typep result_acc :: %{state: t, events: [event], result: :ok | :done | error}

  @spec handle_responses(t, [mint_response], :ok | mint_error) :: stream_result
  defp handle_responses(state, responses, initial_result) do
    initial_acc = %{state: state, events: [], result: initial_result}

    responses
    |> Enum.reduce(initial_acc, &handle_response/2)
    |> then(fn %{events: events} = acc -> %{acc | events: Enum.reverse(events)} end)
    |> handle_result()
  end

  @spec handle_result(result_acc) :: stream_result

  # Encountered no errors; may need to reconnect or re-request
  defp handle_result(%{state: state, events: events, result: :ok} = acc) do
    with {:ok, state} <- maybe_reconnect(state), {:ok, state} <- maybe_rerequest(state) do
      {:ok, state, events}
    else
      {:error, error} -> handle_result(%{acc | result: error})
      {:error, state, error} -> handle_result(%{acc | state: state, result: error})
    end
  end

  # Encountered no errors but the server closed the request; drop the request-specific state
  defp handle_result(%{state: state, events: events, result: :done}) do
    handle_result(%{
      state: %__MODULE__{
        conn: state.conn,
        consumer_arn: state.consumer_arn,
        shard_id: state.shard_id,
        resume_position: state.resume_position,
        options: state.options
      },
      events: events,
      result: :ok
    })
  end

  # Encountered an error; the request may or may not be closed, but it doesn't matter since we
  # always close the whole connection on error
  defp handle_result(%{state: %{conn: conn}, events: events, result: error}) do
    {:ok, _} = HTTP2.close(conn)
    {:error, error, events}
  end

  @spec maybe_reconnect(t) :: {:ok, t} | {:error, mint_error}
  defp maybe_reconnect(%{conn: conn} = state) do
    if HTTP2.open?(conn, :read) do
      {:ok, state}
    else
      # Connection is fully closed; shouldn't get any more messages for it, so can throw it away
      with {:ok, conn} <- state |> build_request() |> connect(), do: {:ok, %{state | conn: conn}}
    end
  end

  @spec maybe_rerequest(t) :: {:ok, t} | {:error, t, mint_error}

  defp maybe_rerequest(%{conn: conn, active?: false} = state) do
    if HTTP2.open?(conn, :write) do
      case state |> build_request() |> then(&request(conn, &1)) do
        {:ok, conn} -> {:ok, %{state | conn: conn, active?: true}}
        {:error, conn, error} -> {:error, %{state | conn: conn}, error}
      end
    else
      # Connection is closed for writing; cannot make any more requests (re-request will occur
      # later when we get the final message and see the connection is also closed for reading)
      {:ok, state}
    end
  end

  defp maybe_rerequest(%{active?: true} = state), do: {:ok, state}

  @spec handle_response(mint_response, result_acc) :: result_acc

  defp handle_response({:status, _ref, code}, %{state: state} = acc) do
    %{acc | state: %{state | status: code}}
  end

  defp handle_response({:headers, _ref, headers}, %{state: state} = acc) do
    %{acc | state: %{state | headers: headers}}
  end

  defp handle_response({:data, _ref, ""}, acc), do: acc

  defp handle_response({:data, _ref, data}, %{state: %{status: 200}} = acc) do
    handle_data(data, acc)
  end

  # When status is not 200, assume data is part of a "normal" (non-streaming) response
  defp handle_response({:data, _ref, data}, %{state: %{buffer: buffer} = state} = acc) do
    %{acc | state: %{state | buffer: [buffer, data]}}
  end

  defp handle_response({:done, _ref}, %{state: %{status: 200}, result: :ok} = acc) do
    %{acc | result: :done}
  end

  # Got :done when current result was not :ok, i.e. the result is an error, so leave it
  defp handle_response({:done, _ref}, %{state: %{status: 200}} = acc), do: acc

  defp handle_response({:done, _ref}, %{state: %{status: status, headers: headers}} = acc)
       when status in 300..399 do
    location = :proplists.get_value("location", headers)
    %{acc | result: {:http_error, status, to_string(location)}}
  end

  defp handle_response(
         {:done, _ref},
         %{state: %{status: status, headers: headers, buffer: buffer}} = acc
       )
       when status in 400..499 do
    @content_type <> _ = :proplists.get_value("content-type", headers)
    %{"__type" => type, "message" => message} = json_codec().decode!(buffer)
    %{acc | result: {type, message}}
  end

  defp handle_response({:done, _ref}, %{state: %{status: status, buffer: buffer}} = acc)
       when status >= 500 do
    %{acc | result: {:http_error, status, IO.iodata_to_binary(buffer)}}
  end

  # Specification for AWS event stream encoding:
  # https://docs.aws.amazon.com/transcribe/latest/dg/event-stream.html
  #
  # For ensuring we have a single complete message before passing it to `EventStream.decode!/1`,
  # all we need to know is that the first 4 bytes of a message indicate its total size.

  @spec handle_data(binary, result_acc) :: result_acc

  # Base case for recursion: no data left to handle
  defp handle_data(<<>>, acc), do: acc

  # Reading a message header, still need more bytes to determine the size
  defp handle_data(
         <<byte, rest::binary>>,
         %{state: %{buffer: buffer, msg_bytes_left: nil} = state} = acc
       )
       when is_binary(buffer) and byte_size(buffer) < 3 do
    handle_data(rest, %{acc | state: %{state | buffer: buffer <> <<byte>>}})
  end

  # Got the last byte needed to determine the size of the current message
  defp handle_data(
         <<byte, rest::binary>>,
         %{state: %{buffer: buffer, msg_bytes_left: nil} = state} = acc
       )
       when is_binary(buffer) and byte_size(buffer) == 3 do
    new_buffer = buffer <> <<byte>>
    bytes_left = :binary.decode_unsigned(new_buffer) - 4
    handle_data(rest, %{acc | state: %{state | buffer: new_buffer, msg_bytes_left: bytes_left}})
  end

  # Got data that is less than the number of bytes left in the current message
  defp handle_data(
         data,
         %{state: %{buffer: buffer, msg_bytes_left: msg_bytes_left} = state} = acc
       )
       when byte_size(data) < msg_bytes_left do
    bytes_left = msg_bytes_left - byte_size(data)
    %{acc | state: %{state | buffer: [buffer, data], msg_bytes_left: bytes_left}}
  end

  # Got data that equals or exceeds the number of bytes left in the current message
  defp handle_data(
         data,
         %{state: %{buffer: buffer, msg_bytes_left: msg_bytes_left} = state} = acc
       ) do
    <<event_tail::binary-size(msg_bytes_left), rest::binary>> = data
    event_data = IO.iodata_to_binary([buffer, event_tail])
    {:ok, headers, json} = EventStream.decode!(event_data)
    @content_type = :proplists.get_value(":content-type", headers)
    message_type = :proplists.get_value(":message-type", headers)
    {:ok, message} = decode_message(json)

    %{acc | state: %{state | buffer: <<>>, msg_bytes_left: nil}}
    |> handle_message(message_type, headers, message)
    |> then(&handle_data(rest, &1))
  end

  @spec handle_message(result_acc, String.t(), headers, event) :: result_acc

  defp handle_message(acc, "event", headers, message) do
    handle_event(acc, :proplists.get_value(":event-type", headers), message)
  end

  defp handle_message(acc, "exception", headers, %{"message" => message}) do
    %{acc | result: {:proplists.get_value(":exception-type", headers), message}}
  end

  @spec handle_event(result_acc, String.t(), event) :: result_acc

  defp handle_event(acc, "initial-response", %{}), do: acc

  defp handle_event(
         %{state: state, events: events} = acc,
         "SubscribeToShardEvent",
         %{"ContinuationSequenceNumber" => sequence_number} = event
       )
       when is_binary(sequence_number) do
    %{
      acc
      | state: %{state | resume_position: {:after_sequence_number, sequence_number}},
        events: [event | events]
    }
  end

  # null ContinuationSequenceNumber indicates the shard is now closed
  defp handle_event(
         %{events: events} = acc,
         "SubscribeToShardEvent",
         %{"ContinuationSequenceNumber" => nil} = event
       ) do
    %{acc | events: [event | events], result: :closed}
  end

  @spec decode_message(String.t()) :: {:ok, map} | {:error, any}
  defp decode_message(json), do: json |> json_codec().decode() |> ExAws.Kinesis.decode_records()

  @spec json_codec() :: module
  defp json_codec, do: :kinesis |> ExAws.Config.new() |> Map.fetch!(:json_codec)

  @typep aws_request ::
           {scheme :: atom, host :: String.t(), port :: integer, method :: String.t(),
            path :: String.t(), headers, body :: binary}

  @spec connect(aws_request) :: {:ok, HTTP2.t()} | {:error, mint_error}
  defp connect({scheme, host, port, _method, _path, _headers, _body}) do
    HTTP2.connect(scheme, host, port)
  end

  @spec request(HTTP2.t(), aws_request) :: {:ok, HTTP2.t()} | {:error, HTTP2.t(), mint_error}
  defp request(conn, {_scheme, _host, _port, method, path, headers, body}) do
    # We only make one request per connection, so don't need to store the request ref in state
    with {:ok, conn, _ref} <- HTTP2.request(conn, method, path, headers, body), do: {:ok, conn}
  end

  @spec build_request(t) :: aws_request
  defp build_request(%__MODULE__{
         consumer_arn: consumer_arn,
         shard_id: shard_id,
         resume_position: resume_position,
         options: options
       }) do
    build_request(consumer_arn, shard_id, resume_position, options)
  end

  @spec build_request(String.t(), String.t(), starting_position, options) :: aws_request
  defp build_request(consumer_arn, shard_id, starting_position, options) do
    build_url_fn = Keyword.get(options, :build_url_fn, &ExAws.Request.Url.build/2)

    op = subscribe_operation(consumer_arn, shard_id, starting_position)
    config = ExAws.Config.new(op.service)
    url = build_url_fn.(op, config)
    body = json_codec().encode!(op.data)
    %{scheme: scheme, host: host, port: port, path: path} = URI.parse(url)
    {:ok, headers} = ExAws.Auth.headers(op.http_method, url, op.service, config, op.headers, body)
    method = op.http_method |> Atom.to_string() |> String.upcase()

    {String.to_existing_atom(scheme), host, port, method, path, headers, body}
  end

  @spec subscribe_operation(String.t(), String.t(), starting_position) :: ExAws.Operation.JSON.t()
  defp subscribe_operation(consumer_arn, shard_id, starting_position) do
    ExAws.Operation.JSON.new(:kinesis, %{
      data: %{
        "ConsumerARN" => consumer_arn,
        "ShardId" => shard_id,
        "StartingPosition" => starting_position_data(starting_position)
      },
      headers: [{"x-amz-target", @target_operation}, {"content-type", @content_type}]
    })
  end

  @spec starting_position_data(starting_position) :: %{String.t() => String.t()}
  defp starting_position_data(type) when type in [:latest, :trim_horizon],
    do: %{"Type" => type |> to_string() |> String.upcase()}

  defp starting_position_data({type, sequence_number})
       when type in [:at_sequence_number, :after_sequence_number] and is_binary(sequence_number),
       do: %{
         "Type" => type |> to_string() |> String.upcase(),
         "SequenceNumber" => sequence_number
       }

  defp starting_position_data({:at_timestamp, %DateTime{} = timestamp}),
    do: %{"Type" => "AT_TIMESTAMP", "Timestamp" => DateTime.to_iso8601(timestamp)}
end
