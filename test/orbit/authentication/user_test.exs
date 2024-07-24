defmodule Orbit.Authentication.UserTest do
  use Orbit.DataCase
  alias Orbit.Authentication.User
  import Orbit.Factory

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

  describe "changeset/2" do
    test "can update user permissions" do
      user = insert(:user, %{permissions: []})

      assert {:ok, %User{permissions: [:operator_sign_in]}} =
               user
               |> User.changeset(%{permissions: [:operator_sign_in]})
               |> Repo.update()
    end

    test "cannot update a user to have duplicate permissions" do
      user = insert(:user)

      assert {:error, _} =
               user
               |> User.changeset(%{permissions: [:operator_sign_in, :operator_sign_in]})
               |> Repo.update()
    end
  end
end
