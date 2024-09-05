defmodule Orbit.Authentication.UserTest do
  use Orbit.DataCase
  alias Orbit.Authentication.User
  alias Orbit.Employee

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

  describe "get_names_from_employee/1" do
    test "looks up name in Employee" do
      Repo.insert!(%Employee{
        first_name: "Arthur",
        preferred_first: "Art",
        last_name: "Read",
        email: "arthur@mbta.com",
        badge_number: "123456789"
      })

      user =
        Repo.insert!(%User{
          email: "arthur@mbta.com",
          permissions: [:operator_sign_in]
        })

      assert User.get_names_from_employee(user) == %{first_name: "Arthur", preferred_first: "Art"}
    end
  end
end
