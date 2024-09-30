defmodule Orbit.Employee do
  use Ecto.Schema
  import Ecto.Changeset
  import Ecto.Query

  alias Orbit.BadgeSerial
  alias Orbit.Repo

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

    has_many(:badge_serials, BadgeSerial, on_replace: :delete_if_exists)

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
    |> cast_assoc(:badge_serials)
  end

  @spec display_name(t()) :: String.t()
  def display_name(employee) do
    case String.trim("#{employee.preferred_first || employee.first_name} #{employee.last_name}") do
      "" -> employee.email
      name -> name
    end
  end

  @spec get_by_badge_serial(String.t()) :: t() | nil
  def get_by_badge_serial(serial) do
    Repo.one(
      from(e in __MODULE__, join: b in assoc(e, :badge_serials), where: b.badge_serial == ^serial)
    )
  end
end
