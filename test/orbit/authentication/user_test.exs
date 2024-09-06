defmodule Orbit.Authentication.UserTest do
  use Orbit.DataCase
  alias Orbit.Authentication.User

  import Orbit.Factory

  test "can insert a user" do
    insert(:user, %{
      email: "test@mbta.com"
    })
  end

  test "cannot insert a duplicate user" do
    insert(:user, %{
      email: "test@mbta.com",
      permissions: [:operator_sign_in]
    })

    assert_raise Ecto.ConstraintError,
                 fn ->
                   insert(:user, %{
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

  describe "get_display_name/1" do
    test "looks up preferred first name in Employee" do
      insert(:employee, %{
        first_name: "Arthur",
        preferred_first: "Art",
        last_name: "Read",
        email: "arthur@mbta.com",
        badge_number: "123456789"
      })

      user =
        insert(:user, %{
          email: "arthur@mbta.com",
          permissions: [:operator_sign_in]
        })

      assert User.get_display_name(user) == "Art Read"
    end

    test "uses first name when preferred unavailable" do
      insert(:employee, %{
        first_name: "Arthur",
        preferred_first: nil,
        last_name: "Read",
        email: "arthur@mbta.com",
        badge_number: "123456789"
      })

      user =
        insert(:user, %{
          email: "arthur@mbta.com",
          permissions: [:operator_sign_in]
        })

      assert User.get_display_name(user) == "Arthur Read"
    end

    test "uses first Employee when multiple have the same email address" do
      insert(:employee, %{
        first_name: "Arthur",
        preferred_first: "Art",
        last_name: "Read",
        email: "arthur@mbta.com",
        badge_number: "123456789"
      })

      insert(:employee, %{
        first_name: "Arthur2",
        preferred_first: "Art2",
        last_name: "Read2",
        email: "arthur@mbta.com",
        badge_number: "987654321"
      })

      user =
        insert(:user, %{
          email: "arthur@mbta.com",
          permissions: [:operator_sign_in]
        })

      assert User.get_display_name(user) == "Art Read"
    end
  end
end
