defmodule Orbit.Employee do
  use Ecto.Schema
  import Ecto.Changeset

  @type t :: %__MODULE__{
          id: integer(),
          first_name: String.t() | nil,
          preferred_first: String.t() | nil,
          middle_initial: String.t() | nil,
          last_name: String.t() | nil,
          email: String.t() | nil,
          badge_number: String.t() | nil,
          area: integer() | nil
        }

  schema "employees" do
    field(:first_name, :string)
    field(:preferred_first, :string)
    field(:middle_initial, :string)
    field(:last_name, :string)
    field(:email, :string)
    field(:badge_number, :string)
    field(:area, :integer)

    timestamps()
  end

  def changeset(employee, params \\ %{}) do
    employee
    |> cast(
      params,
      [
        :first_name,
        :preferred_first,
        :middle_initial,
        :last_name,
        :email,
        :badge_number,
        :area
      ]
    )
    |> check_constraint(:badge_number, name: :badge_number_no_leading_zeroes)
  end
end
