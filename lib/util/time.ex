defmodule Util.Time do
  @typedoc """
  Unix timestamp, seconds past the epoch
  """
  @type timestamp :: integer()
  @timezone Application.compile_env!(:orbit, :timezone)

  @spec current_timezone :: Calendar.time_zone()
  def current_timezone do
    @timezone
  end

  @spec current_time :: timestamp
  def current_time do
    System.system_time(:second)
  end

  @spec current_datetime :: DateTime.t()
  def current_datetime do
    DateTime.now!(@timezone)
  end

  @spec current_service_date :: Date.t()
  def current_service_date do
    service_date_for_timestamp(current_time())
  end

  @spec service_date_for_timestamp(timestamp) :: Date.t()
  def service_date_for_timestamp(timestamp) do
    utc_datetime = DateTime.from_unix!(timestamp, :second)
    service_date_for_utc_datetime(utc_datetime)
  end

  @spec service_date_for_utc_datetime(DateTime.t()) :: Date.t()
  def service_date_for_utc_datetime(utc_datetime) do
    eastern_datetime = Timex.Timezone.convert(utc_datetime, @timezone)
    real_date = DateTime.to_date(eastern_datetime)

    if eastern_datetime.hour in [0, 1, 2] do
      Date.add(real_date, -1)
    else
      real_date
    end
  end

  @spec service_date_boundaries(Date.t()) :: {DateTime.t(), DateTime.t()}
  def service_date_boundaries(service_date) do
    {DateTime.new!(service_date, ~T[03:00:00], @timezone),
     DateTime.new!(Date.add(service_date, 1), ~T[03:00:00], @timezone)}
  end

  @doc """
  Sanitize the given DateTime for compatibility with Ecto's :utc_datetime
  field type. This converts the DateTime to UTC and truncates down to an
  even number of seconds.
  """
  @spec to_ecto_utc(DateTime.t()) :: DateTime.t()
  def to_ecto_utc(datetime) do
    datetime
    |> DateTime.shift_zone!("Etc/UTC")
    |> DateTime.truncate(:second)
  end
end
