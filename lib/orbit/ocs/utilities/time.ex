defmodule Orbit.Ocs.Utilities.Time do
  @moduledoc """
  Some utility functions for dealing with times
  """
  require FastLocalDatetime
  require Logger

  @doc """
  Parse the internal timestamp of an OCS message, and interpret it into a full DateTime,
  based on the DateTime when the OCS message was emitted.

  msg_time: An (HH:mm:ss)-formatted string used internally by OCS to indicate when the
            message change occurred.
  emitted_datetime: The DateTime that TID systems received the event from OCS. Trike
                    currently emits these in UTC.
  timezone: The preferred timezone for the output.
  """
  @spec interpret_ocs_message_timestamp(String.t(), DateTime.t(), String.t()) :: DateTime.t()
  def interpret_ocs_message_timestamp(
        msg_time,
        emitted_datetime,
        timezone \\ Application.get_env(:orbit, :timezone)
      ) do
    # Interpret message time as local time for the same date that the message was emitted.
    [hours, minutes, seconds] = msg_time |> String.split(":") |> Enum.map(&String.to_integer/1)

    emitted_datetime_local = DateTime.shift_zone!(emitted_datetime, timezone)
    emitted_date = DateTime.to_date(emitted_datetime_local)

    {dt, same_day?} =
      case DateTime.new(
             emitted_date,
             Time.new!(hours, minutes, seconds),
             timezone
           ) do
        {:ok, dt} ->
          {dt, true}

        {:ambiguous, earlier_dt, later_dt} ->
          # Ambiguous datetimes occur during daylight savings fallback, for example
          # when interpreting 1:00 am, which occurs twice, 1 hour apart. We choose
          # whichever timestamp is closer to the emitted datetime.
          {closer_datetime(earlier_dt, later_dt, emitted_datetime), true}

        {:gap, _before_gap, _after_gap} ->
          # Gap datetimes could occur during daylight savings time spring-ahead,
          # when local time jumps from 1:59:59am to 3:00:00am. We generally do not
          # expect OCS timestamps to occur within a gap, as OCS seemingly already
          # handles the jump. Therefore it is more reasonable to assume that a gap
          # datetime is stale and corresponds to the previuous day.
          {nil, false}
      end

    # If this message time is assumed to be the same day, then allow it to be up to
    # one hour in the future from the time it was emitted. (This is a convention from
    # RTR). Otherwise assume it is from the day before.
    if same_day? and DateTime.before?(dt, DateTime.shift(emitted_datetime, hour: 1)) do
      dt
    else
      # This date time did not make sense when contextualized in the same date as the
      # the emission time, so the best we can do is assume that it is stale (ie, from)
      # the previous day.
      adjusted_date = Date.shift(emitted_date, day: -1)

      case DateTime.new(
             adjusted_date,
             Time.new!(hours, minutes, seconds),
             timezone
           ) do
        {:ok, dt} -> dt
        # If timestamps are stale enough to be interpreted as yesterday, then we lack
        # the information to discern between ambiguous or gap timestamps. Just assume
        # the later time.
        {:ambiguous, _earlier, later} -> later
        {:gap, _before_gap, after_gap} -> after_gap
      end
    end
  end

  @spec closer_datetime(DateTime.t(), DateTime.t(), DateTime.t()) :: DateTime.t()
  defp closer_datetime(earlier, later, datetime) do
    diff = DateTime.diff(later, earlier, :second)
    cutoff = DateTime.shift(earlier, second: trunc(diff / 2))

    if DateTime.before?(datetime, cutoff) do
      earlier
    else
      later
    end
  end

  @service_date_hour_cutoff 2

  @doc """
  Converts TSCH message time (hh:mm) to number of seconds since midnight, in local time.
  For times given between midnight and 2 AM, we assume the schedule time indicates the
  following service date.
  """
  @spec parse_tsch_msg_time(String.t()) :: integer | nil
  def parse_tsch_msg_time(time) when is_binary(time) do
    [hrs, mins] = String.split(time, ":")
    hours = String.to_integer(hrs)
    hours = if hours < @service_date_hour_cutoff, do: hours + 24, else: hours
    hours * 3600 + String.to_integer(mins) * 60
  end

  @doc """
  Convert various possible datetime representations into a fully specified DateTime
  in the correct local timezone.
  """
  @spec in_ocs_tz(
          Date.t() | DateTime.t() | NaiveDateTime.t() | integer(),
          String.t()
        ) ::
          DateTime.t()
  def in_ocs_tz(datetime, timezone \\ Application.get_env(:orbit, :timezone))

  def in_ocs_tz(%Date{} = date, timezone) do
    {:ok, ndt} = NaiveDateTime.new(date, ~T[00:00:00])
    in_ocs_tz(ndt, timezone)
  end

  def in_ocs_tz(%DateTime{time_zone: time_zone} = datetime, time_zone) do
    datetime
  end

  def in_ocs_tz(%DateTime{} = time, time_zone) do
    # There _shouldn't_ be any DateTime's in the wrong tz. Adding logging
    # to run for a while and see if it comes up.
    Logger.warning("event=dt_in_wrong_tz DateTime not in same zone: #{inspect(time)}")
    Logger.info("#{inspect(Process.info(self(), :current_stacktrace))}")
    {:ok, new_dt} = DateTime.shift_zone(time, time_zone)
    new_dt
  end

  def in_ocs_tz(%NaiveDateTime{} = time, timezone) do
    naive_to_datetime(time, timezone)
  end

  def in_ocs_tz(time, timezone) when is_integer(time) do
    {:ok, new_dt} = DateTime.from_unix(time)
    {:ok, new_dt} = DateTime.shift_zone(new_dt, timezone)
    new_dt
  end

  @spec seconds_since_midnight_to_date_time(integer, Date.t(), Timex.Types.valid_timezone()) ::
          DateTime.t()
  def seconds_since_midnight_to_date_time(
        seconds_since_midnight,
        %Date{} = current_service_date,
        timezone \\ Application.get_env(:orbit, :timezone)
      ) do
    {:ok, dt} =
      current_service_date
      |> service_date_pseudo_midnight_unix()
      |> Kernel.+(seconds_since_midnight)
      |> FastLocalDatetime.unix_to_datetime(timezone)

    dt
  end

  @doc """
  Returns the unix timestamp of "midnight" where midnight is
  defined according to the way GTFS handles it:
  > Time - Time in the HH:MM:SS format (H:MM:SS is also accepted). The time
  > is measured from "noon minus 12h" of the service day (effectively
  > midnight except for days on which daylight savings time changes occur).
  > For times occurring after midnight, enter the time as a value greater
  > than 24:00:00 in HH:MM:SS local time for the day on which the trip
  > schedule begins.
  """
  @spec service_date_pseudo_midnight_unix(Date.t()) :: pos_integer()
  def service_date_pseudo_midnight_unix(%Date{} = date) do
    {:ok, naive_noon} = NaiveDateTime.new(date, ~T[12:00:00])

    naive_noon
    |> in_ocs_tz()
    |> DateTime.to_unix()
    |> Kernel.-(12 * 60 * 60)
  end

  @spec get_service_date(DateTime.t()) :: Date.t()
  def get_service_date(%DateTime{} = current_time \\ Util.Time.current_datetime()) do
    date = DateTime.to_date(current_time)

    if current_time.hour < @service_date_hour_cutoff do
      Date.add(date, -1)
    else
      date
    end
  end

  defp naive_to_datetime(naive_datetime, time_zone) do
    case DateTime.from_naive(naive_datetime, time_zone) do
      {:ok, dt} ->
        dt

      {:ambiguous, before_dt, _after_dt} ->
        Logger.warning(
          "event=in_ocs_tz_ambiguous_dt ambiguous date time #{inspect(naive_datetime)}"
        )

        before_dt

      {:gap, _before_dt, after_dt} ->
        Logger.warning("event=in_ocs_tz_gap gap datetime #{inspect(naive_datetime)}")
        after_dt
    end
  end
end
