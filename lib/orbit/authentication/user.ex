defmodule Orbit.Authentication.User do
  use Ecto.Schema
  import Ecto.Changeset

  @type t :: %__MODULE__{
          id: integer(),
          email: String.t(),
          inserted_at: DateTime.t(),
          updated_at: DateTime.t()
        }

  schema "users" do
    field(:email, :string)
    timestamps()
  end

  def create_changeset(struct, params \\ %{}) do
    struct
    |> cast(params, [
      :email
    ])
    |> validate_required([:email])
    |> unique_constraint(
      :users,
      name: :users_email_index
    )
  end
end
