defmodule Util.DateTest do
  use ExUnit.Case, async: true

  describe "valid_iso8601?" do
    test "returns true if valid" do
      assert true == Util.Date.valid_iso8601?("2025-01-08")
    end

    test "returns false if invalid" do
      assert false == Util.Date.valid_iso8601?("2025----01-08")
    end
  end
end
