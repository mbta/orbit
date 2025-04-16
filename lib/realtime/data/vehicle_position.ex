defmodule Realtime.Data.VehiclePosition do
  @moduledoc """
  The subset of the VehiclePosition data in the enhanced_json feed that we use.
  """
  use Ecto.Schema

  @type t :: %__MODULE__{
          route_id: Realtime.Data.route_id() | nil,
          direction: integer(),
          label: String.t(),
          position: Util.Position.t() | nil,
          heading: float() | nil,
          station_id: String.t() | nil,
          current_status: :INCOMING_AT | :STOPPED_AT | :IN_TRANSIT_TO,
          timestamp: DateTime.t() | nil,
          # GTFS-RT id, e.g. "R-54826B16".
          vehicle_id: String.t() | nil,
          trip: nil
        }

  schema "vehicle_positions" do
    field(:route_id, Util.AtomType)
    field(:direction, :integer)
    field(:label, :string, default: "")
    field(:position, Util.PositionType, default: nil)
    field(:heading, :float, default: nil)
    field(:station_id, :string, default: nil)
    field(:current_status, Util.AtomType, default: :IN_TRANSIT_TO)
    field(:timestamp, :utc_datetime, default: nil)
    field(:vehicle_id, :string, virtual: true, default: nil)
    field(:trip, :map, virtual: true, default: nil)
    timestamps()
  end
end
