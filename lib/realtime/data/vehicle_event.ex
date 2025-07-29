defmodule Realtime.Data.VehicleEvent do
  use Ecto.Schema
  import Ecto.Changeset

  alias Orbit.RailLine

  @type t :: %__MODULE__{
          service_date: Date.t(),
          cars: [String.t()],
          station_id: String.t(),
          vehicle_id: String.t(),
          direction_id: integer(),
          rail_line: RailLine.t(),
          arrival_departure: :arrival | :departure,
          timestamp: DateTime.t()
        }

  schema "vehicle_events" do
    field(:service_date, :date)
    field(:rail_line, RailLine)
    field(:cars, {:array, :string})
    field(:station_id, :string)
    field(:vehicle_id, :string)
    field(:direction_id, :integer)
    field(:arrival_departure, Ecto.Enum, values: [:arrival, :departure])
    field(:timestamp, :utc_datetime)
    timestamps(type: :utc_datetime)
  end

  def changeset(struct, attrs \\ %{}) do
    struct
    |> cast(
      attrs,
      [
        :service_date,
        :rail_line,
        :cars,
        :station_id,
        :vehicle_id,
        :direction_id,
        :arrival_departure,
        :timestamp
      ]
    )
    |> validate_required([
      :service_date,
      :rail_line,
      :cars,
      :station_id,
      :vehicle_id,
      :direction_id,
      :arrival_departure,
      :timestamp
    ])
    |> validate_inclusion(:direction_id, [0, 1])
    |> validate_inclusion(:arrival_departure, [:arrival, :departure])
  end
end
