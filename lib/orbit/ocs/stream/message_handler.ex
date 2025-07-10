defmodule Orbit.Ocs.MessageHandler do
  require Logger

  alias Orbit.Ocs.Message

  @expired_seconds 86_400

  @spec handle_messages(
          messages :: [String.t()],
          current_time :: DateTime.t()
        ) :: :ok
  def handle_messages(raw_messages, current_time) do
    _parsed_messages =
      raw_messages
      |> Enum.flat_map(fn raw_message ->
        Logger.info("raw_ocs_message #{raw_message}")

        with {:ok, parsed} <- parse(raw_message, current_time),
             {:ok, message} <- check_expired(parsed, current_time) do
          [message]
        else
          _ ->
            []
        end
      end)

    # TODO: Write trip changes to database

    :ok
  end

  @spec parse(String.t(), DateTime.t()) ::
          {:ok, Message.t()} | :ignored | {:error, any}
  defp parse(raw_message, current_time) do
    case Orbit.Ocs.Parser.parse(raw_message, current_time) do
      {:ok, %{transitline: transitline} = message} when transitline in [:red, :orange, :blue] ->
        {:ok, message}

      {:ok, _other} ->
        :ignored

      {:error, e} ->
        Logger.warning(
          "event=ocs_message_parse_issue Issue with line #{raw_message} : #{Exception.format(:error, e)}"
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
