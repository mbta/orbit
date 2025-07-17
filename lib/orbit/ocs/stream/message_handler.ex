defmodule Orbit.Ocs.MessageHandler do
  require Logger

  alias Orbit.Ocs.EntitiesServer
  alias Orbit.Ocs.Message
  alias Orbit.Ocs.SplunkFormatter

  @expired_seconds 86_400

  @spec handle_messages(
          messages :: [%{raw_message: String.t(), event_time: DateTime.t()}],
          current_time :: DateTime.t()
        ) :: :ok
  def handle_messages(messages, current_time) do
    parsed_messages =
      messages
      |> Enum.flat_map(fn %{raw_message: raw_message, event_time: event_time} ->
        Logger.info("raw_ocs_message data=#{raw_message} cloud_event_time=#{event_time}")

        with {:ok, parsed} <- parse(raw_message, event_time),
             {:ok, message} <- check_expired(parsed, current_time) do
          [message]
        else
          _ ->
            []
        end
      end)

    EntitiesServer.new_messages(parsed_messages)

    :ok
  end

  @spec parse(
          raw_message :: String.t(),
          event_time :: DateTime.t()
        ) ::
          {:ok, Message.t()} | :ignored | {:error, any}
  defp parse(raw_message, event_time) do
    case Orbit.Ocs.Parser.parse(raw_message, event_time) do
      {:ok, %{transitline: transitline} = message} when transitline in [:red, :orange, :blue] ->
        Logger.info(SplunkFormatter.format(message))
        {:ok, message}

      {:ok, _other} ->
        :ignored

      {:error, e} ->
        Logger.warning(
          "event=ocs_message_parse_issue line=#{raw_message} error=#{Exception.format(:error, e)}"
        )

        {:error, e}
    end
  end

  @spec check_expired(Message.t(), DateTime.t()) :: {:ok, Message.t()} | {:error, any}
  defp check_expired(message, current_time) do
    if expired?(message, current_time) do
      log_expired_message(message)
      {:error, "expired message"}
    else
      {:ok, message}
    end
  end

  @spec expired?(Orbit.Ocs.Message.t(), DateTime.t()) :: boolean
  def expired?(%{timestamp: timestamp}, current_time) do
    Timex.Comparable.diff(current_time, timestamp, :seconds) > @expired_seconds
  end

  def expired?(_message, _current_time) do
    false
  end

  @spec log_expired_message(Orbit.Ocs.Message.t()) :: :ok
  defp log_expired_message(message) do
    Logger.warning(
      "event=ocs_message_expired Message #{inspect(message)} was expired at the time we tried to process it"
    )
  end
end
