defmodule Realtime.Data.TripUpdate do
  @moduledoc """
  The subset of the TripUpdate data in the enhanced-json feed that we use.
  """

  @type t :: %__MODULE__{
          label: String.t(),
          route_id: Realtime.Data.route_id(),
          direction: String.t(),
          stop_time_updates: []
        }

  @enforce_keys [
    :label,
    :route_id
  ]
  defstruct [
    :label,
    :route_id,
    direction: nil,
    stop_time_updates: []
  ]

  defmodule StopTimeUpdate do
    @type t :: %__MODULE__{
            station_id: String.t(),
            predicted_arrival_time: Util.Time.timestamp() | nil,
            predicted_departure_time: Util.Time.timestamp() | nil
          }

    @enforce_keys [
      :station_id
    ]
    defstruct [
      :station_id,
      :predicted_arrival_time,
      :predicted_departure_time
    ]
  end

  defmodule Prediction do
    @moduledoc """
    Represents a trip update after it's been filtered to be a prediction for a specific stop
    """

    @type t :: %__MODULE__{
            label: String.t(),
            route_id: Realtime.Data.route_id(),
            direction: Realtime.Data.direction(),
            station_id: String.t(),
            predicted_time: Util.Time.timestamp()
          }

    @derive Jason.Encoder
    @enforce_keys [
      :label,
      :route_id,
      :direction,
      :station_id,
      :predicted_time
    ]
    defstruct [
      :label,
      :route_id,
      :direction,
      :station_id,
      :predicted_time
    ]
  end
end
