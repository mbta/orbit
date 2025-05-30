defmodule Realtime.Data.VehiclePosition do
  @moduledoc """
  The subset of the VehiclePosition data in the enhanced_json feed that we use.
  """
  use Ecto.Schema

  @type t :: %__MODULE__{
          route_id: Realtime.Data.route_id(),
          direction: integer(),
          label: String.t(),
          cars: [String.t()],
          position: Util.Position.t(),
          heading: float() | nil,
          station_id: String.t() | nil,
          stop_id: String.t() | nil,
          current_status: :INCOMING_AT | :STOPPED_AT | :IN_TRANSIT_TO,
          timestamp: DateTime.t(),
          # GTFS-RT id, e.g. "R-54826B16".
          vehicle_id: String.t() | nil,
          trip: Realtime.Data.TripDescriptor.t()
        }

  @derive {Jason.Encoder,
           only: [
             :route_id,
             :direction,
             :label,
             :cars,
             :position,
             :heading,
             :station_id,
             :stop_id,
             :current_status,
             :timestamp,
             :vehicle_id,
             :trip
           ]}
  schema "vehicle_positions" do
    field(:route_id, Util.AtomType)
    field(:direction, :integer)
    field(:label, :string)
    field(:cars, {:array, :string})
    field(:position, Util.PositionType)
    field(:heading, :float, default: nil)
    field(:station_id, :string, default: nil)
    field(:stop_id, :string, default: nil)
    field(:current_status, Util.AtomType, default: :IN_TRANSIT_TO)
    field(:timestamp, :utc_datetime)
    field(:vehicle_id, :string, virtual: true, default: nil)
    field(:trip, Realtime.Data.TripDescriptorType, default: nil)
    timestamps()
  end
end
