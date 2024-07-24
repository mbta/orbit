defmodule Orbit.Authentication.UserTest do
  use Orbit.DataCase
  alias Orbit.Authentication.User

  test "can insert a user" do
    Repo.insert!(%User{
      email: "test@mbta.com"
    })
  end

  test "cannot insert a duplicate user" do
    Repo.insert!(%User{
      email: "test@mbta.com",
      permissions: [:operator_sign_in]
    })

    assert_raise Ecto.ConstraintError,
                 fn ->
                   Repo.insert!(%User{
                     email: "test@mbta.com",
                     permissions: [:operator_sign_in]
                   })
                 end
  end
end
