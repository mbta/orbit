defmodule OCS.MessageHandler do
  require Logger

  @expired_seconds 86_400
  @max_process_time 66_000

  @spec receive(String.t(), DateTime.t()) :: {:ok | :error, any}
  def receive(line, current_time) do
    # TODO: Health monitoring?
    Logger.info("raw_ocs_message #{line}")

    case OCS.Parser.parse(line, current_time) do
      {:ok, :ignored} ->
        {:ok, :ignored}

      {:ok, message} ->
        # TODO: Log to splunk

        if expired?(message, current_time) do
          log_expired_message(message)

          {:error, "expired message"}
        else
          {time, val} = :timer.tc(fn -> handle_message(message, current_time) end)
          log_slow_message_handling(time, @max_process_time, message)
          val
        end

      {:error, e} ->
        Logger.warning(
          "event=ocs_message_parse_issue Issue with line #{line} : #{Exception.format(:error, e)}"
        )

        {:error, e}
    end
  end

  @spec expired?(OCS.Message.t(), DateTime.t()) :: boolean
  def expired?(%{timestamp: timestamp}, current_time) do
    Timex.Comparable.diff(current_time, timestamp, :seconds) > @expired_seconds
  end

  def expired?(_message, _current_time) do
    false
  end

  @spec log_expired_message(OCS.Message.t()) :: :ok
  defp log_expired_message(message) do
    Logger.warning(
      "event=ocs_message_expired Message #{inspect(message)} was expired at the time we tried to process it"
    )
  end

  @spec log_slow_message_handling(integer, integer, OCS.Message.t()) :: :ok | {:error, String.t()}
  def log_slow_message_handling(time_in_microseconds, max_time, message)
      when time_in_microseconds > max_time do
    Logger.info("Message #{inspect(message)} took #{time_in_microseconds / 1000} ms to process")
  end

  def log_slow_message_handling(_time, _max_time, _message), do: :ok

  @spec handle_message(OCS.Message.t(), DateTime.t()) :: {:ok, %{} | :ignored}
  defp handle_message(_message, _current_time) do
    # TODO: Update DB based on message type
    {:ok, %{}}
  end
end
