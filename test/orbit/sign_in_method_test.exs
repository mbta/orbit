defmodule Orbit.SignInMethodTest do
  use ExUnit.Case
  alias Orbit.SignInMethod

  describe "type/0" do
    test "returns correct result" do
      assert SignInMethod.type() == :string
    end
  end

  describe "cast/1" do
    test "casts valid values" do
      Enum.each([:manual, :nfc], fn line ->
        assert SignInMethod.cast(line) == {:ok, line}
      end)
    end

    test "errors on invalid value" do
      assert SignInMethod.cast(:wax_seal) == :error
    end
  end

  describe "load/1" do
    test "loads valid values" do
      assert SignInMethod.load("manual") == {:ok, :manual}
      assert SignInMethod.load("nfc") == {:ok, :nfc}
    end

    test "errors on invalud value" do
      assert SignInMethod.load("wax_seal") == :error
    end
  end

  describe "dump/1" do
    test "dumps valid atoms to strings" do
      assert SignInMethod.dump(:manual) == {:ok, "manual"}
      assert SignInMethod.dump(:nfc) == {:ok, "nfc"}
    end

    test "errors on invalid value" do
      assert SignInMethod.dump(:wax_seal) == :error
    end
  end
end
