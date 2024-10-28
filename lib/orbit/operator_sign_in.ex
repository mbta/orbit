defmodule Orbit.OperatorSignIn do
  use Ecto.Schema
  import Ecto.Changeset

  alias Orbit.Authentication.User
  alias Orbit.Employee
  alias Orbit.RailLine
  alias Orbit.SignInMethod

  @type t :: %__MODULE__{
          signed_in_employee: Employee.t(),
          signed_in_by_user: User.t(),
          signed_in_at: DateTime.t(),
          rail_line: RailLine.t(),
          radio_number: String.t() | nil,
          sign_in_method: SignInMethod.t()
        }

  schema "operator_sign_ins" do
    belongs_to(:signed_in_employee, Employee)
    belongs_to(:signed_in_by_user, User)
    field(:signed_in_at, :utc_datetime)
    field(:rail_line, RailLine)
    field(:radio_number, :string)
    field(:sign_in_method, SignInMethod)

    timestamps()
  end

  def changeset(operator_sign_in, attrs \\ %{}) do
    operator_sign_in
    |> cast(attrs, [:signed_in_at, :rail_line, :radio_number, :sign_in_method])
    |> cast_assoc(:signed_in_employee)
    |> cast_assoc(:signed_in_by_user)
    |> validate_required([:signed_in_at, :rail_line, :sign_in_method])
  end
end
