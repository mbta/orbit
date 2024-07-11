defmodule OrbitWeb.SignInController do
  alias Orbit.Employee
  alias Orbit.OperatorSignIn
  alias OrbitWeb.Auth.Auth

  use OrbitWeb, :controller
  import Ecto.Query

  alias Orbit.Repo

  @spec submit(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def submit(conn, %{
        "signed_in_employee_badge" => signed_in_employee_badge,
        "signed_in_at" => signed_in_at,
        "line" => line,
        "method" => method
      }) do
    signed_in_at = DateTime.from_unix!(signed_in_at)

    # ⚠️ TODO: remove before merge
    :timer.sleep(1000)

    %OperatorSignIn{
      signed_in_employee:
        Repo.one!(from(e in Employee, where: e.badge_number == ^signed_in_employee_badge)),
      signed_in_by_user: Auth.logged_in_user(conn),
      signed_in_at: signed_in_at,
      rail_line: String.to_existing_atom(line),
      sign_in_method: String.to_existing_atom(method)
    }
    |> OperatorSignIn.changeset()
    |> Repo.insert!()

    text(conn, "OK")
  end
end
