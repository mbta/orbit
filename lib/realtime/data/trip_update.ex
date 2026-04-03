defmodule Realtime.Data.TripUpdate do
  @moduledoc """
  The subset of the TripUpdate data in the enhanced-json feed that we use.
  """

  @type t :: %__MODULE__{
          label: String.t() | nil,
          route_id: Realtime.Data.route_id(),
          direction: String.t() | nil,
          route_pattern_id: String.t(),
          trip_id: String.t(),
          vehicle_id: String.t() | nil,
          timestamp: DateTime.t() | nil,
          stop_time_updates: []
        }

  @derive Jason.Encoder
  @enforce_keys [
    :vehicle_id,
    :route_id
  ]
  defstruct [
    :label,
    :route_id,
    :timestamp,
    :trip_id,
    :vehicle_id,
    route_pattern_id: nil,
    direction: nil,
    stop_time_updates: []
  ]

  defmodule StopTimeUpdate do
    @type t :: %__MODULE__{
            station_id: String.t(),
            predicted_arrival_time: Util.Time.timestamp() | nil,
            predicted_departure_time: Util.Time.timestamp() | nil
          }

    @derive Jason.Encoder
    @enforce_keys [
      :station_id
    ]
    defstruct [
      :station_id,
      :predicted_arrival_time,
      :predicted_departure_time
    ]
  end

  @spec last_arrival_time(__MODULE__.t() | nil) :: DateTime.t() | nil

  def last_arrival_time(nil), do: nil

  def last_arrival_time(trip_update) do
    case List.last(trip_update.stop_time_updates) do
      %StopTimeUpdate{predicted_arrival_time: time} ->
        time

      _ ->
        nil
    end
  end
end
