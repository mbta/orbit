defmodule FakeKinesis do
  @moduledoc "Helper functions for faking the Kinesis SubscribeToShard endpoint using Bypass."

  alias Plug.Conn

  def expect(bypass, func), do: Bypass.expect(bypass, "POST", "/", func)
  def expect_once(bypass, func), do: Bypass.expect_once(bypass, "POST", "/", func)

  def respond(conn, status, body) do
    conn
    |> Conn.put_resp_content_type("application/x-amz-json-1.1")
    |> Conn.send_resp(status, body)
  end

  def stream(conn, chunks) do
    {:ok, conn} =
      conn
      |> Conn.put_resp_content_type("application/vnd.amazon.eventstream")
      |> Conn.send_chunked(200)
      |> Conn.chunk(encode_event("initial-response", %{}))

    Enum.reduce(chunks, conn, fn chunk, conn ->
      {:ok, conn} = Conn.chunk(conn, chunk)
      conn
    end)
  end

  def encode_message(type, message, headers) do
    message
    |> Jason.encode!()
    |> EventStream.encode!(
      [{":content-type", "application/x-amz-json-1.1"}, {":message-type", type}] ++ headers
    )
  end

  def encode_event(type \\ "SubscribeToShardEvent", event) do
    encode_message("event", event, [{":event-type", type}])
  end

  def encode_exception(type, message) do
    encode_message("exception", %{"message" => message}, [{":exception-type", type}])
  end
end
