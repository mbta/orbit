defmodule Orbit.Ocs.Train do
  use Ecto.Schema
  alias Orbit.RailLine

  import Ecto.Changeset

  @type t :: %__MODULE__{
          service_date: Date.t(),
          uid: String.t(),
          rail_line: RailLine.t(),
          tags: [String.t()] | nil,
          cars: [String.t()] | nil,
          car_tags: [String.t()] | nil,
          deleted: boolean() | nil
        }
  schema "ocs_trains" do
    field(:service_date, :date)
    field(:uid, :string)
    field(:rail_line, RailLine)

    field(:tags, {:array, :string})
    field(:cars, {:array, :string})
    field(:car_tags, {:array, :string})
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
        :rail_line,
        :tags,
        :cars,
        :car_tags,
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
