defmodule Orbit.Authentication.User do
  alias Orbit.Authentication.UserPermission
  use Ecto.Schema
  import Ecto.Changeset

  @type t :: %__MODULE__{
          id: integer(),
          email: String.t(),
          permissions: [UserPermission.t()],
          inserted_at: DateTime.t(),
          updated_at: DateTime.t()
        }

  schema "users" do
    field(:email, :string)
    field(:permissions, {:array, UserPermission})
    timestamps()
  end

  def create_changeset(struct, params \\ %{}) do
    struct
    |> cast(params, [
      :email,
      :permissions
    ])
    |> validate_required([:email, :permissions])
    |> unique_constraint(
      :users,
      name: :users_email_index
    )
  end
end
