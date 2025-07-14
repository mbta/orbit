defmodule Orbit.Ocs.Parser do
  @moduledoc """
  This module parses a string consisting of comma-separated values into a tuple
  of the form {count, type, time, rest}
  count -> The sequence counter of the message (int)
  type -> an atom for the message type (:tmov, :tsch, :devi)
  time -> a Time sigil for the timestamp of the message
  rest -> a list of the remaining values from the message

  Note that the term "emitted_time" refers to the time at which an event was emitted, ie the timestamp
  of the CloudEvent propagated through TID systems. This is not necessarily the same as:
  - the current timestamp at the time of parsing, as events may be received late, and old events may be
  replayed from a buffered source (such as a Kinesis stream).
  - the exact timestamp that the message was created within OCS, as we cannot guarantee said messages
  were passed immediately to our systems.
  """

  alias Orbit.Ocs.TransitLine

  @spec parse(String.t(), DateTime.t()) :: {:ok, Orbit.Ocs.Message.t() | :ignored} | {:error, any}
  def parse(line, emitted_time) do
    {:ok, parse!(line, emitted_time)}
  rescue
    e -> {:error, e}
  end

  @spec parse!(String.t(), DateTime.t()) :: Orbit.Ocs.Message.t() | :ignored
  def parse!(line, emitted_time) do
    line
    |> parse_initial(emitted_time)
    |> parse_by_msg_type(emitted_time)
    |> case do
      {:ok, msg} -> msg
      {:error, e} -> raise e
    end
  end

  defp parse_initial(line, emitted_time) do
    [counter, msg_type, msg_time | rest] = String.split(line, ",")
    {count, ""} = Integer.parse(counter)

    type =
      try do
        String.to_existing_atom(String.downcase(msg_type))
      rescue
        ArgumentError -> msg_type
      end

    time = get_time(msg_time, emitted_time)
    {count, type, time, rest}
  end

  defp parse_by_msg_type(msg, emitted_time) do
    case msg do
      {_count, :tsch, _timestamp, _args} ->
        Orbit.Ocs.Parser.TschMessage.parse(msg, emitted_time)

      # Ignore remaining valid message types that are unimplemented for now
      {_count, msg_type, _timestamp, _args} when msg_type in [:tmov, :devi, :diag, :rgps] ->
        {:ok, :ignored}

      {_count, msg_type, _timestamp, _args} ->
        {:error, "Message type #{msg_type} did not match any expected message"}
    end
  end

  # The message time contained within an OCS message does not specify the full date, but only
  # the hour, minute, and second relative to the date that the message was emitted. Therefore
  # we need to infer the full timestamp by considering the service date on which the message
  # was originally emitted.
  @spec get_time(String.t(), DateTime.t()) :: DateTime.t()
  defp get_time(msg_time, emitted_datetime) do
    # allow msg_time to be up to one hour in the future from the time it was emitted;
    # otherwise assume it is from the day before
    time = Timex.parse!(msg_time, "{h24}:{m}:{s}")
    dt = Timex.set(emitted_datetime, hour: time.hour, minute: time.minute, second: time.second)

    if Timex.before?(dt, Timex.shift(emitted_datetime, hours: 1)) do
      dt
    else
      Timex.shift(dt, days: -1)
    end
  end

  # OCS can't handle car numbers duplicated across transit lines.
  # Starting in 2023, new 1500-series Orange Line cars have arrived before
  # the 1500 Red Line cars are retired.
  # So in January 2024 the OCC started inputting the Red Line 15xx cars as 25xx.
  # Map them back to 15xx.
  @spec convert_ocs_car_number(TransitLine.t(), String.t()) :: String.t()
  def convert_ocs_car_number(:red, "25" <> car_number_rest) do
    "15" <> car_number_rest
  end

  def convert_ocs_car_number(_transitline, car_number) do
    car_number
  end
end
