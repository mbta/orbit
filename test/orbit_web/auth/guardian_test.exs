defmodule OrbitWeb.Auth.GuardianTest do
  use Orbit.DataCase
  alias OrbitWeb.Auth.Guardian
  import Orbit.Factory

  describe "subject_for_token/2" do
    test "returns email address field" do
      user = build(:user)

      assert {:ok, user.email} == Guardian.subject_for_token(user, %{})
    end
  end

  describe "resource_for_claims/1" do
    test "pulls user from database" do
      user = insert(:user)

      assert {:ok, user} == Guardian.resource_from_claims(%{"sub" => user.email})
    end
  end
end
