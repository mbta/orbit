defmodule Realtime.Data.StationsTest do
  use ExUnit.Case, async: true

  alias Realtime.Data.Stations

  describe "direction_from_stations" do
    test "red line: handles alewife <--> ashmont branches" do
      # Endpoint to endpoint
      assert 0 == Stations.direction_from_stations("place-alfcl", "place-asmnl")
      assert 1 == Stations.direction_from_stations("place-asmnl", "place-alfcl")
      # Midline to midline
      assert 0 == Stations.direction_from_stations("place-pktrm", "place-smmnl")
      assert 1 == Stations.direction_from_stations("place-smmnl", "place-pktrm")
      # JFK
      assert 0 == Stations.direction_from_stations("place-alfcl", "place-jfk")
      assert 1 == Stations.direction_from_stations("place-jfk", "place-alfcl")
      assert 1 == Stations.direction_from_stations("place-asmnl", "place-jfk")
      assert 0 == Stations.direction_from_stations("place-jfk", "place-asmnl")
    end

    test "red line: handles alewife <--> braintree branches" do
      # Endpoint to endpoint
      assert 0 == Stations.direction_from_stations("place-alfcl", "place-brntn")
      assert 1 == Stations.direction_from_stations("place-brntn", "place-alfcl")
      # Midline to midline
      assert 0 == Stations.direction_from_stations("place-pktrm", "place-qnctr")
      assert 1 == Stations.direction_from_stations("place-qnctr", "place-pktrm")
      # JFK
      assert 0 == Stations.direction_from_stations("place-alfcl", "place-jfk")
      assert 1 == Stations.direction_from_stations("place-jfk", "place-alfcl")
      assert 1 == Stations.direction_from_stations("place-brntn", "place-jfk")
      assert 0 == Stations.direction_from_stations("place-jfk", "place-brntn")
    end

    test "red line: handles ashmont <--> braintree branches" do
      # To go from one southern branch to the other, it is assumed that the train must
      # travel north, at least to JFK. Therefore the answer should always be "northbound"
      assert 1 == Stations.direction_from_stations("place-asmnl", "place-brntn")
      assert 1 == Stations.direction_from_stations("place-brntn", "place-asmnl")
      assert 1 == Stations.direction_from_stations("place-smmnl", "place-qnctr")
      assert 1 == Stations.direction_from_stations("place-qnctr", "place-smmnl")
    end

    test "red line: handles endpoints within same branch" do
      # Alewife <--> Downtown Crossing
      assert 0 == Stations.direction_from_stations("place-alfcl", "place-dwnxg")
      assert 1 == Stations.direction_from_stations("place-dwnxg", "place-alfcl")
      # Shawmut <--> Ashmont
      assert 0 == Stations.direction_from_stations("place-smmnl", "place-asmnl")
      assert 1 == Stations.direction_from_stations("place-asmnl", "place-smmnl")
      # Quincy Center <--> Braintree
      assert 0 == Stations.direction_from_stations("place-qnctr", "place-brntn")
      assert 1 == Stations.direction_from_stations("place-brntn", "place-qnctr")
    end

    test "returns ambiguous for missing endpoints" do
      assert :ambiguous == Stations.direction_from_stations("place-alfcl", nil)
      assert :ambiguous == Stations.direction_from_stations(nil, "place-asmnl")
      assert :ambiguous == Stations.direction_from_stations(nil, nil)
    end

    test "returns ambiguous for same station" do
      assert :ambiguous == Stations.direction_from_stations("place-pktrm", "place-pktrm")
    end

    test "returns ambiguous for unknown stations" do
      assert :ambiguous == Stations.direction_from_stations("place-alfcl", "test")
      assert :ambiguous == Stations.direction_from_stations("test", "place-asmnl")
      assert :ambiguous == Stations.direction_from_stations("test", "test")
      assert :ambiguous == Stations.direction_from_stations("dollywood", "test")
    end
  end
end
