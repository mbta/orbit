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

  def changeset(struct, params \\ %{}) do
    struct
    |> cast(params, [
      :email,
      :permissions
    ])
    |> validate_required([:email, :permissions])
    |> validate_change(:permissions, fn :permissions, permissions ->
      if permissions |> Enum.uniq() |> length() == length(permissions) do
        []
      else
        [permissions: "cannot contain duplicate values"]
      end
    end)
    |> unique_constraint(
      :users,
      name: :users_email_index
    )
  end
end
