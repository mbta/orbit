defmodule Orbit.Vehicle do
  alias Orbit.Ocs.Trip
  alias Realtime.Data.TripUpdate
  alias Realtime.Data.VehiclePosition

  @type t :: %__MODULE__{
          position: VehiclePosition.t(),
          trip_update: TripUpdate.t() | nil,
          ocs_trips: %{current: Trip.t(), next: [Trip.t()], past: [Trip.t()]}
        }

  defstruct [
    :position,
    :trip_update,
    :ocs_trips
  ]
end

defimpl Jason.Encoder, for: Orbit.Vehicle do
  def encode(value, opts) do
    # Omit the past trips for now, since the frontend does not expect or care about it
    {_, value} = pop_in(value, [Access.key(:ocs_trips), :past])
    Jason.Encode.map(value, opts)
  end
end
