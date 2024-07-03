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
      email: "test@mbta.com"
    })

    assert_raise Ecto.ConstraintError,
                 fn ->
                   Repo.insert!(%User{
                     email: "test@mbta.com"
                   })
                 end
  end
end
