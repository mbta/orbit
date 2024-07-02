defmodule Orbit.User do
  use Ecto.Schema

  @type t :: %__MODULE__{
          id: integer(),
          email: String.t()
        }

  schema "users" do
    field :email, :string

    timestamps()
  end
end
