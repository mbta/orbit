defmodule Orbit.RailLineTest do
  use ExUnit.Case
  alias Orbit.RailLine

  describe "type/0" do
    test "returns correct result" do
      assert RailLine.type() == :string
    end
  end

  describe "cast/1" do
    test "casts valid values" do
      Enum.each([:red, :orange, :blue], fn line ->
        assert RailLine.cast(line) == {:ok, line}
      end)
    end

    test "errors on invalid value" do
      assert RailLine.cast(:turquoise) == :error
    end
  end

  describe "load/1" do
    test "loads valid values" do
      assert RailLine.load("red") == {:ok, :red}
      assert RailLine.load("orange") == {:ok, :orange}
      assert RailLine.load("blue") == {:ok, :blue}
    end

    test "errors on invalud value" do
      assert RailLine.load("magenta") == :error
    end
  end

  describe "dump/1" do
    test "dumps valid atoms to strings" do
      assert RailLine.dump(:red) == {:ok, "red"}
      assert RailLine.dump(:orange) == {:ok, "orange"}
      assert RailLine.dump(:blue) == {:ok, "blue"}
    end

    test "errors on invalid value" do
      assert RailLine.dump(:pink) == :error
    end
  end
end
