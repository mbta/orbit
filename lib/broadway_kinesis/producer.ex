# credo:disable-for-this-file Credo.Check.Refactor.LongQuoteBlocks
defmodule BroadwayKinesis.Producer do
  require BroadwayKinesis.SubscribeToShard
  require ExAws
  alias BroadwayKinesis.ProducerRegistry

  defmodule State do
    @type t :: %__MODULE__{
            conn: BroadwayKinesis.SubscribeToShard.t() | nil,
            consumer_arn: String.t(),
            resume_position: BroadwayKinesis.SubscribeToShard.starting_position(),
            stream_name: String.t()
          }

    defstruct [
      :conn,
      :consumer_arn,
      :stream_name,
      :monitor_pid,
      ex_aws: ExAws,
      subscribe_opts: [],
      conn_state: :uninitialized,
      resume_position: :latest
    ]
  end

  defmacro __using__(
             consumer_arn: consumer_arn,
             stream_name: stream_name
           ) do
    quote do
      @moduledoc """
      Generic Broadway producer that creates Messages from Kinesis events.
      """
      use GenStage

      @behaviour Broadway.Producer
      @reconnection_delay 70 * 1000

      require BroadwayKinesis.SubscribeToShard
      require ExAws
      require Logger
      alias BroadwayKinesis.Producer.State

      @spec init_state(Enum.t()) :: State.t()
      defp init_state(overrides) do
        struct!(
          State,
          Map.merge(
            %{consumer_arn: unquote(consumer_arn), stream_name: unquote(stream_name)},
            overrides
          )
        )
      end

      @impl true
      def init(opts) do
        state_overrides = Keyword.get(opts, :state, %{})
        enable? = Keyword.get(opts, :enable?, true)

        %{
          consumer_arn: consumer_arn,
          resume_position: resume_position,
          stream_name: stream_name
        } = state = init_state(state_overrides)

        log("BroadwayKinesis.Producer started")

        if enable? do
          {:ok, conn} = subscribe_to_shard(state)
          ProducerRegistry.register(state)
          {:producer, %{state | conn: conn, conn_state: :established}}
        else
          ProducerRegistry.unregister(state)
          {:producer, %{state | conn: :disabled, conn_state: :disabled}}
        end
      end

      @impl true
      def handle_info(message, %{conn: conn} = state)
          when BroadwayKinesis.SubscribeToShard.is_message(conn, message) do
        case BroadwayKinesis.SubscribeToShard.stream(conn, message) do
          {:ok, new_conn, events} ->
            ProducerRegistry.update_value(state, true)

            log("handle_info_success")

            {:noreply, events, %{state | conn: new_conn, conn_state: :normal}}

          {:error, {"ResourceInUseException", _} = error, events} ->
            ProducerRegistry.update_value(state, false)

            log("handle_info_error")

            warn("event=resource_in_use_exception #{inspect(error)}")

            retry_conn(state, events, error, :resource_in_use_exception)

          {:error, %Mint.TransportError{reason: :closed} = error, events} ->
            ProducerRegistry.update_value(state, false)

            log("handle_info_error")

            warn("event=mint_transport_error #{inspect(error)}")

            retry_conn(state, events, error, :retry)

          {:error, {:http_error, _, _} = error, events} ->
            ProducerRegistry.update_value(state, false)

            log("handle_info_error")

            warn("event=http_error #{inspect(error)}")

            retry_conn(state, events, error, :http_error)

          {:error, :closed = error, events} ->
            ProducerRegistry.update_value(state, false)

            log("handle_info_error")

            warn("event=subscribe_to_shard_closed #{inspect(error)}")

            retry_conn(state, events, error, :closed)

          {:error, error, events} ->
            ProducerRegistry.update_value(state, false)

            log("handle_info_error")

            error("event=error #{inspect(error)}")

            retry_conn(state, events, error, :error)
        end
      end

      @impl true
      def handle_info({:resume_position_update, sequence_number}, state) do
        {:noreply, [], %{state | resume_position: sequence_number}}
      end

      @impl true
      def handle_info(:reconnect, state) do
        warn("Attempting reconnection...")
        {:ok, new_conn} = subscribe_to_shard(state)
        {:noreply, [], %{state | conn: new_conn, conn_state: :normal}}
      end

      @impl true
      def handle_info(message, state) do
        warn("event=noreply message=#{inspect(message)}")
        {:noreply, [], state}
      end

      @impl true
      def handle_demand(demand, state) do
        {:noreply, [], state}
      end

      defp retry_conn(state, events, error, monitor_msg) do
        if is_nil(state.monitor_pid) do
          if not is_nil(state.conn), do: Mint.HTTP2.close(state.conn.conn)
          warn("Connection lost, attempting reconnection in #{@reconnection_delay}ms...")
          Process.send_after(self(), :reconnect, @reconnection_delay)
          {:noreply, events, %{state | conn_state: :retry}}
        else
          Kernel.send(state.monitor_pid, {monitor_msg, error})
          {:noreply, events, %{state | conn_state: :retry}}
        end
      end

      defp subscribe_to_shard(state) do
        %{"StreamDescription" => %{"Shards" => [%{"ShardId" => shard_id}]}} =
          unquote(stream_name)
          |> ExAws.Kinesis.describe_stream()
          |> state.ex_aws.request!()

        resume_position =
          if state.resume_position == :latest,
            do: :latest,
            else: {:after_sequence_number, state.resume_position}

        result =
          BroadwayKinesis.SubscribeToShard.subscribe(
            unquote(consumer_arn),
            shard_id,
            resume_position,
            state.subscribe_opts || []
          )

        log("event=subscribe shard_id=#{shard_id} resume_position=#{inspect(resume_position)}")

        result
      end

      defp log(message), do: Logger.info("#{__MODULE__}: #{message}")
      defp warn(message), do: Logger.warning("#{__MODULE__}: #{message}")
      defp error(message), do: Logger.error("#{__MODULE__}: #{message}")
    end
  end
end
