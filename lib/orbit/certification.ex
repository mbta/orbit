defmodule Orbit.Certification do
  use Ecto.Schema
  import Ecto.Changeset

  alias Orbit.RailLine

  # Over in Glides "rail" is referred to as "operator", but it's the same thing.
  @type certification_type :: :right_of_way | :rail
  def certification_type_strings, do: MapSet.new(["right_of_way", "rail"])

  @type t :: %__MODULE__{
          badge: String.t(),
          type: certification_type(),
          rail_line: RailLine.t(),
          expires: Date.t()
        }
  schema "certifications" do
    field(:badge, :string)
    field(:type, Ecto.Enum, values: [right_of_way: 0, rail: 1])
    field(:rail_line, RailLine)
    field(:expires, :date)
    timestamps()
  end

  def changeset(struct, attrs \\ %{}) do
    struct
    |> cast(attrs, [
      :badge,
      :type,
      :rail_line,
      :expires
    ])
    |> unique_constraint([:badge, :type, :rail_line])
    |> validate_required([:badge, :type, :expires])
  end
end
