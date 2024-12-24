defmodule Orbit.Import.HelpersTest do
  use Orbit.DataCase
  alias Orbit.Import.ImportHelpers

  describe "parse_csv" do
    test "parses headers" do
      assert [%{"col1" => "a", "col2" => "b", "col3" => "c", "col4" => "d"}] =
               Enum.take(
                 ImportHelpers.parse_csv(
                   [
                     "col1,col2,col3,col4",
                     "a,b,c,d"
                   ],
                   true
                 ),
                 4
               )
    end

    test "custom headers option" do
      assert [%{gl: "a", ol: "b", rl: "c", bl: "d"}] =
               Enum.take(
                 ImportHelpers.parse_csv(
                   [
                     "col1,col2,col3,col4",
                     "a,b,c,d"
                   ],
                   [:gl, :ol, :rl, :bl]
                 ),
                 4
               )
    end

    test "headers disabled" do
      assert [["a", "b", "c", "d"]] =
               Enum.take(
                 ImportHelpers.parse_csv(
                   [
                     "col1,col2,col3,col4",
                     "a,b,c,d"
                   ],
                   false
                 ),
                 4
               )
    end

    test "trims lines" do
      assert [%{col1: "a", col2: "b", col3: "c", col4: "d"}] =
               Enum.take(
                 ImportHelpers.parse_csv(
                   [
                     "   col1,    col2      ,col3,   col4",
                     "     a,    b     ,c,d     "
                   ],
                   [:col1, :col2, :col3, :col4]
                 ),
                 4
               )
    end
  end
end
