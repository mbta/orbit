defmodule Orbit.Ocs.Trip do
  use Ecto.Schema
  alias Orbit.RailLine

  import Ecto.Changeset

  @type t :: %__MODULE__{
          service_date: Date.t(),
          uid: String.t(),
          train_uid: String.t() | nil,
          prev_uid: String.t() | nil,
          next_uid: String.t() | nil,
          route: String.t() | nil,
          rail_line: RailLine.t(),
          trip_type: String.t() | nil,
          scheduled_departure: DateTime.t() | nil,
          scheduled_arrival: DateTime.t() | nil,
          origin_station: String.t() | nil,
          destination_station: String.t() | nil,
          deleted: boolean() | nil
        }

  schema "ocs_trips" do
    field(:service_date, :date)
    field(:uid, :string)
    field(:train_uid, :string)

    field(:prev_uid, :string)
    field(:next_uid, :string)

    field(:route, :string)
    field(:rail_line, RailLine)
    field(:trip_type, :string)

    field(:scheduled_departure, :utc_datetime)
    field(:scheduled_arrival, :utc_datetime)
    field(:origin_station, :string)
    field(:destination_station, :string)
    field(:deleted, :boolean)

    timestamps()
  end

  def changeset(struct, attrs \\ %{}) do
    struct
    |> cast(
      attrs,
      [
        :service_date,
        :uid,
        :train_uid,
        :prev_uid,
        :next_uid,
        :route,
        :rail_line,
        :trip_type,
        :scheduled_departure,
        :scheduled_arrival,
        :origin_station,
        :destination_station,
        :deleted
      ]
    )
    |> unique_constraint([:service_date, :uid, :rail_line])
    |> validate_required([
      :service_date,
      :uid,
      :rail_line
    ])
  end
end
