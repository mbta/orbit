defmodule Util.MapTest do
  use ExUnit.Case, async: true
  alias Util.Map

  describe "has_exactly?" do
    test "true with string keys" do
      assert Map.has_exactly?(%{"a" => 4}, MapSet.new(["a"]))
    end

    test "true with atom keys" do
      assert Map.has_exactly?(%{a: 4}, MapSet.new([:a]))
    end

    test "true with arbitrary order" do
      assert Map.has_exactly?(%{a: 4, b: 5}, MapSet.new([:b, :a]))
    end

    test "false on too many keys" do
      assert !Map.has_exactly?(%{"a" => 4, "b" => 5}, MapSet.new(["a"]))
    end

    test "false on too few keys" do
      assert !Map.has_exactly?(%{}, MapSet.new(["a"]))
    end

    test "false on wrong type of key" do
      assert !Map.has_exactly?(%{"a" => 4}, MapSet.new([:a]))
    end
  end
end
