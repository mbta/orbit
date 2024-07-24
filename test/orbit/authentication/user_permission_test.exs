defmodule Orbit.Authentication.UserPermissionTest do
  use ExUnit.Case
  alias Orbit.Authentication.UserPermission

  describe "type/0" do
    test "returns correct result" do
      assert UserPermission.type() == :string
    end
  end

  describe "cast/1" do
    test "casts valid values" do
      assert UserPermission.cast(:operator_sign_in) == {:ok, :operator_sign_in}
    end

    test "errors on invalid value" do
      assert UserPermission.cast(:delete_everything) == :error
    end
  end

  describe "load/1" do
    test "loads valid values" do
      assert UserPermission.load("operator_sign_in") == {:ok, :operator_sign_in}
    end

    test "errors on invalud value" do
      assert UserPermission.load("delete_everything") == :error
    end
  end

  describe "dump/1" do
    test "dumps valid atoms to strings" do
      assert UserPermission.dump(:operator_sign_in) == {:ok, "operator_sign_in"}
    end

    test "errors on invalid value" do
      assert UserPermission.dump(:delete_everything) == :error
    end
  end
end
