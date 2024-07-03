defmodule Orbit.OperatorSignInTest do
  use Orbit.DataCase
  import Orbit.Factory

  describe "changeset/2" do
    test "can update" do
      operator_sign_in = insert(:operator_sign_in, %{sign_in_method: :nfc})

      {:ok, new_operator_sign_in} =
        operator_sign_in
        |> Orbit.OperatorSignIn.changeset(%{sign_in_method: :manual})
        |> Orbit.Repo.update()

      assert new_operator_sign_in.sign_in_method == :manual
    end
  end
end
