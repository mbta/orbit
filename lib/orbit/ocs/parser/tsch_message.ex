defmodule Orbit.Ocs.Parser.TschMessage do
  @moduledoc """
  TSCH message type from OCS system, includes functions to parse all sub-types
  """

  require Logger

  alias Orbit.Ocs.TransitLine
  alias Orbit.Ocs.Utilities.Time, as: OcsTime

  @spec parse({integer, :tsch, DateTime.t(), [String.t()]}, DateTime.t()) ::
          {:ok, Orbit.Ocs.Message.t()} | {:error, any()}
  def parse(msg, emitted_time) do
    {:ok, parse!(msg, emitted_time)}
  rescue
    e ->
      {:error, e}
  end

  @spec get_delete_status(String.t()) :: :deleted | :undeleted
  defp get_delete_status(raw_status)

  defp get_delete_status("0") do
    :undeleted
  end

  defp get_delete_status("1") do
    :deleted
  end

  @spec schedule_time_to_datetime(String.t(), DateTime.t()) :: DateTime.t()
  defp schedule_time_to_datetime(
         sch_str,
         emitted_time,
         timezone \\ Application.get_env(:orbit, :timezone)
       ) do
    sch_str
    |> OcsTime.parse_tsch_msg_time()
    |> OcsTime.seconds_since_midnight_to_date_time(
      OcsTime.get_service_date(emitted_time),
      timezone
    )
  end

  @spec parse!({integer, :tsch, DateTime.t(), [String.t()]}, DateTime.t()) ::
          Orbit.Ocs.Message.t()
  def parse!(message, emitted_time) do
    {count, :tsch, message_time, [raw_transitline | rest]} = message

    parse_sub_type(
      {
        count,
        message_time,
        TransitLine.from_ocs_raw(raw_transitline),
        rest
      },
      emitted_time
    )
  end

  @spec parse_sub_type({integer, DateTime.t(), TransitLine.t(), [String.t()]}, DateTime.t()) ::
          Orbit.Ocs.Message.t()
  defp parse_sub_type(message, emitted_time)

  defp parse_sub_type(
         {count, time, transitline, ["CON", trip_uid, train_consist, train_uid | extra_values]},
         _emitted_time
       ) do
    log_error_for_extra_fields(count, "TSCH_CON", extra_values)

    con =
      train_consist
      |> String.split(" ")
      |> Enum.map(&Orbit.Ocs.Parser.convert_ocs_car_number(transitline, &1))

    %Orbit.Ocs.Message.TschConMessage{
      counter: count,
      timestamp: time,
      transitline: transitline,
      trip_uid: trip_uid,
      consist: con,
      train_uid: train_uid
    }
  end

  defp parse_sub_type(
         {count, time, transitline,
          [
            "NEW",
            trip_uid,
            add_type,
            trip_type,
            sched_dep_str,
            sched_arr_str,
            ocs_route_id,
            origin_sta,
            dest_sta,
            prev_trip_uid,
            next_trip_uid
            | extra_values
          ]},
         emitted_time
       ) do
    log_error_for_extra_fields(count, "TSCH_NEW", extra_values)
    next_trip_uid = if next_trip_uid == "0", do: nil, else: next_trip_uid
    prev_trip_uid = if prev_trip_uid == "0", do: nil, else: prev_trip_uid

    sched_dep =
      if sched_dep_str == "",
        do: nil,
        else: schedule_time_to_datetime(sched_dep_str, emitted_time)

    sched_arr =
      if sched_arr_str == "",
        do: nil,
        else: schedule_time_to_datetime(sched_arr_str, emitted_time)

    %Orbit.Ocs.Message.TschNewMessage{
      counter: count,
      timestamp: time,
      transitline: transitline,
      trip_uid: trip_uid,
      add_type: add_type,
      trip_type: trip_type,
      sched_dep: sched_dep,
      sched_arr: sched_arr,
      ocs_route_id: nil_if_empty(ocs_route_id),
      origin_sta: nil_if_empty(origin_sta),
      dest_sta: nil_if_empty(dest_sta),
      prev_trip_uid: nil_if_empty(prev_trip_uid),
      next_trip_uid: nil_if_empty(next_trip_uid)
    }
  end

  defp parse_sub_type(
         {count, time, transitline, ["ASN", train_uid, trip_uid | extra_values]},
         _emitted_time
       ) do
    log_error_for_extra_fields(count, "TSCH_ASN", extra_values)

    %Orbit.Ocs.Message.TschAsnMessage{
      counter: count,
      timestamp: time,
      transitline: transitline,
      train_uid: train_uid,
      trip_uid: trip_uid
    }
  end

  defp parse_sub_type({count, time, transitline, ["RLD" | rest]}, _emitted_time) do
    # RLD may optionally contain one extra field for the schedule type
    log_error_for_extra_fields(count, "TSCH_RLD", Enum.drop(rest, 1))

    %Orbit.Ocs.Message.TschRldMessage{
      counter: count,
      timestamp: time,
      transitline: transitline
    }
  end

  defp parse_sub_type(
         {count, time, transitline, ["DEL", trip_uid, delete_status | extra_values]},
         _emitted_time
       ) do
    log_error_for_extra_fields(count, "TSCH_DEL", extra_values)

    %Orbit.Ocs.Message.TschDelMessage{
      counter: count,
      timestamp: time,
      transitline: transitline,
      trip_uid: trip_uid,
      delete_status: get_delete_status(delete_status)
    }
  end

  defp parse_sub_type(
         {count, time, transitline,
          ["LNK", trip_uid, prev_trip_uid, next_trip_uid | extra_values]},
         _emitted_time
       ) do
    log_error_for_extra_fields(count, "TSCH_LNK", extra_values)

    prev_trip_uid = if prev_trip_uid == "0", do: nil, else: prev_trip_uid
    next_trip_uid = if next_trip_uid == "0", do: nil, else: next_trip_uid

    %Orbit.Ocs.Message.TschLnkMessage{
      counter: count,
      timestamp: time,
      transitline: transitline,
      trip_uid: trip_uid,
      prev_trip_uid: prev_trip_uid,
      next_trip_uid: next_trip_uid
    }
  end

  defp parse_sub_type(
         {count, time, transitline, ["OFF", trip_uid, offset | extra_values]},
         _emitted_time
       ) do
    log_error_for_extra_fields(count, "TSCH_OFF", extra_values)

    %Orbit.Ocs.Message.TschOffMessage{
      counter: count,
      timestamp: time,
      transitline: transitline,
      trip_uid: trip_uid,
      offset: String.to_integer(offset)
    }
  end

  defp parse_sub_type(
         {count, time, transitline,
          ["DST", trip_uid, dest_sta, ocs_route_id_str, sched_arr_str | extra_values]},
         emitted_time
       ) do
    log_error_for_extra_fields(count, "TSCH_DST", extra_values)

    ocs_route_id =
      if ocs_route_id_str == "",
        do: nil,
        else: ocs_route_id_str

    # Added to conform with other timestamps
    sched_arr =
      if sched_arr_str == "",
        do: nil,
        else: schedule_time_to_datetime(sched_arr_str, emitted_time)

    %Orbit.Ocs.Message.TschDstMessage{
      counter: count,
      timestamp: time,
      transitline: transitline,
      trip_uid: trip_uid,
      dest_sta: dest_sta,
      ocs_route_id: ocs_route_id,
      sched_arr: sched_arr
    }
  end

  defp parse_sub_type(
         {count, time, transitline, ["TAG", trip_uid, train_uid, consist_tags | car_tags]},
         _emitted_time
       ) do
    %Orbit.Ocs.Message.TschTagMessage{
      counter: count,
      timestamp: time,
      transitline: transitline,
      train_uid: train_uid,
      trip_uid: trip_uid,
      consist_tags: parse_tags(consist_tags),
      car_tags:
        Stream.map(car_tags, &String.split_at(&1, 1))
        |> Enum.map(fn {tag, car_id} ->
          %Orbit.Ocs.Message.TschTagMessage.CarTag{
            car_number: Orbit.Ocs.Parser.convert_ocs_car_number(transitline, car_id),
            tag:
              if tag == " " do
                nil
              else
                tag
              end
          }
        end)
    }
  end

  @spec parse_tags(binary()) :: [String.t()]
  def parse_tags(str) do
    str
    |> String.graphemes()
    |> Enum.reject(&Kernel.==(&1, " "))
  end

  defp nil_if_empty(str) do
    if str == "" do
      nil
    else
      str
    end
  end

  @spec log_error_for_extra_fields(integer, String.t(), list()) :: nil
  defp log_error_for_extra_fields(message_counter, message_type, values)
       when length(values) > 0 do
    Logger.error(
      "Orbit.Ocs.Parser.TschMessage: Unexpected extra values at end of message count=#{inspect(message_counter)} type=#{inspect(message_type)} extra_values=#{inspect(values)}"
    )
  end

  defp log_error_for_extra_fields(_, _, _) do
  end
end
