defmodule Orbit.BadgeSerial do
  use Ecto.Schema
  import Ecto.Changeset

  alias Orbit.Employee

  @type t :: %__MODULE__{
          badge_serial: String.t(),
          employee: Employee.t() | nil
        }

  schema "badge_serials" do
    belongs_to(:employee, Employee)
    field(:badge_serial, :string)

    timestamps()
  end

  def changeset(badge_serial, attrs \\ %{}) do
    badge_serial
    |> cast(attrs, [:badge_serial])
    |> validate_required([:badge_serial])
    |> foreign_key_constraint(:employee_id)
  end
end
