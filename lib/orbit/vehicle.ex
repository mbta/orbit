defmodule Orbit.Vehicle do
  alias Orbit.Ocs.Trip
  alias Realtime.Data.TripUpdate
  alias Realtime.Data.VehiclePosition

  @type t :: %__MODULE__{
          position: VehiclePosition.t(),
          trip_update: TripUpdate.t(),
          ocs_trips: %{current: Trip.t(), next: [Trip.t()]}
        }

  @derive Jason.Encoder
  defstruct [
    :position,
    :trip_update,
    :ocs_trips
  ]
end
