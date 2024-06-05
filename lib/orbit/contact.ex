defmodule Orbit.Contact do
  use Ecto.Schema
  import Ecto.Changeset

  @type t :: %__MODULE__{
          id: integer(),
          first_name: String.t() | nil,
          middle_initial: String.t() | nil,
          last_name: String.t() | nil,
          email_address: String.t() | nil,
          badge_number: String.t() | nil,
          area: integer() | nil
        }

  schema "contacts" do
    field(:first_name, :string)
    field(:middle_initial, :string)
    field(:last_name, :string)
    field(:email_address, :string)
    field(:badge_number, :string)
    field(:area, :integer)

    timestamps()
  end

  def changeset(contact, params \\ %{}) do
    contact
    |> cast(
      params,
      [
        :first_name,
        :middle_initial,
        :last_name,
        :email_address,
        :badge_number,
        :area
      ]
    )
    |> check_constraint(:badge_number, name: :badge_number_no_leading_zeroes)
  end
end
