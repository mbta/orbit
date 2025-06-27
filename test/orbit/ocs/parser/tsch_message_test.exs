defmodule Orbit.Ocs.Message.TschMessageTest do
  use ExUnit.Case, async: true
  alias Orbit.Ocs.Message.TschTagMessage.CarTag
  alias Orbit.Ocs.Utilities.Time, as: OcsTime

  @test_time OcsTime.in_ocs_tz(~N[2017-03-17 09:44:01])

  describe "parse/2" do
    test "handles bad arguments" do
      assert {:error, _error} =
               Orbit.Ocs.Parser.TschMessage.parse(:foo, @test_time)
    end

    test "parses TSCH CON message" do
      assert Orbit.Ocs.Parser.TschMessage.parse(
               {4331, :tsch, @test_time,
                ["R", "CON", "983AC23D", "1737 1736 1725 1724 1731 1730", "54466E3A"]},
               @test_time
             ) ==
               {:ok,
                %Orbit.Ocs.Message.TschConMessage{
                  counter: 4331,
                  timestamp: @test_time,
                  transitline: "R",
                  trip_uid: "983AC23D",
                  consist: ["1737", "1736", "1725", "1724", "1731", "1730"],
                  train_uid: "54466E3A"
                }}
    end

    test "Red Line 25xx cars in TSCH CON mapped to 15xx" do
      assert Orbit.Ocs.Parser.TschMessage.parse(
               {4331, :tsch, @test_time,
                ["R", "CON", "983AC23D", "2537 2536 1725 1724 1731 1730", "54466E3A"]},
               @test_time
             ) ==
               {:ok,
                %Orbit.Ocs.Message.TschConMessage{
                  counter: 4331,
                  timestamp: @test_time,
                  transitline: "R",
                  trip_uid: "983AC23D",
                  consist: ["1537", "1536", "1725", "1724", "1731", "1730"],
                  train_uid: "54466E3A"
                }}
    end

    test "parses TSCH RLD message" do
      assert Orbit.Ocs.Parser.TschMessage.parse(
               {3081, :tsch, @test_time, ["O", "RLD", "W"]},
               @test_time
             ) ==
               {:ok,
                %Orbit.Ocs.Message.TschRldMessage{
                  counter: 3081,
                  timestamp: @test_time,
                  transitline: "O"
                }}
    end

    test "parses TSCH RLD message (old style)" do
      assert Orbit.Ocs.Parser.TschMessage.parse(
               {3081, :tsch, @test_time, ["O", "RLD"]},
               @test_time
             ) ==
               {:ok,
                %Orbit.Ocs.Message.TschRldMessage{
                  counter: 3081,
                  timestamp: @test_time,
                  transitline: "O"
                }}
    end

    test "parses TSCH NEW message" do
      assert Orbit.Ocs.Parser.TschMessage.parse(
               {3083, :tsch, @test_time,
                [
                  "O",
                  "NEW",
                  "9866D295",
                  "S",
                  "R",
                  "05:16",
                  "05:53",
                  "S903_",
                  "OAK GROVE",
                  "FOREST HILLS",
                  "9866D294",
                  "9866D296"
                ]},
               @test_time
             ) ==
               {:ok,
                %Orbit.Ocs.Message.TschNewMessage{
                  counter: 3083,
                  timestamp: @test_time,
                  transitline: "O",
                  trip_uid: "9866D295",
                  add_type: "S",
                  trip_type: "R",
                  sched_dep: OcsTime.in_ocs_tz(~N[2017-03-17 05:16:00]),
                  sched_arr: OcsTime.in_ocs_tz(~N[2017-03-17 05:53:00]),
                  ocs_route_id: "S903_",
                  origin_sta: "OAK GROVE",
                  dest_sta: "FOREST HILLS",
                  prev_trip_uid: "9866D294",
                  next_trip_uid: "9866D296"
                }}
    end

    test "parses TSCH NEW message with incomplete data (in this case, an RAD train)" do
      assert Orbit.Ocs.Parser.TschMessage.parse(
               {28_329, :tsch, @test_time,
                ["B", "NEW", "98AA06F7", "A", "R", "", "", "", "WONDERLAND", "", "0", "0"]},
               @test_time
             ) ==
               {:ok,
                %Orbit.Ocs.Message.TschNewMessage{
                  counter: 28_329,
                  timestamp: @test_time,
                  transitline: "B",
                  trip_uid: "98AA06F7",
                  add_type: "A",
                  trip_type: "R",
                  sched_dep: nil,
                  sched_arr: nil,
                  ocs_route_id: nil,
                  origin_sta: "WONDERLAND",
                  dest_sta: nil,
                  prev_trip_uid: nil,
                  next_trip_uid: nil
                }}
    end

    test "parses TSCH DST message" do
      assert Orbit.Ocs.Parser.TschMessage.parse(
               {4520, :tsch, @test_time, ["R", "DST", "983BA807", "CADDIGAN YARD", "", ""]},
               @test_time
             ) ==
               {:ok,
                %Orbit.Ocs.Message.TschDstMessage{
                  counter: 4520,
                  timestamp: @test_time,
                  transitline: "R",
                  trip_uid: "983BA807",
                  dest_sta: "CADDIGAN YARD",
                  ocs_route_id: nil,
                  sched_arr: nil
                }}
    end

    test "parses TSCH ASN message" do
      assert Orbit.Ocs.Parser.TschMessage.parse(
               {4520, :tsch, @test_time, ["R", "ASN", "54466E3A", "983BA807"]},
               @test_time
             ) ==
               {:ok,
                %Orbit.Ocs.Message.TschAsnMessage{
                  counter: 4520,
                  timestamp: @test_time,
                  transitline: "R",
                  train_uid: "54466E3A",
                  trip_uid: "983BA807"
                }}
    end

    test "parses TSCH LNK message" do
      assert Orbit.Ocs.Parser.TschMessage.parse(
               {19_332, :tsch, @test_time, ["R", "LNK", "983BA716", "983BA715", "983BA710"]},
               @test_time
             ) ==
               {:ok,
                %Orbit.Ocs.Message.TschLnkMessage{
                  counter: 19_332,
                  timestamp: @test_time,
                  transitline: "R",
                  trip_uid: "983BA716",
                  prev_trip_uid: "983BA715",
                  next_trip_uid: "983BA710"
                }}
    end

    test "parses TSCH LNK message with '0' trips as nil trips" do
      assert Orbit.Ocs.Parser.TschMessage.parse(
               {19_223, :tsch, @test_time, ["R", "LNK", "983BA716", "983BA715", "0"]},
               @test_time
             ) ==
               {:ok,
                %Orbit.Ocs.Message.TschLnkMessage{
                  counter: 19_223,
                  timestamp: @test_time,
                  transitline: "R",
                  trip_uid: "983BA716",
                  prev_trip_uid: "983BA715",
                  next_trip_uid: nil
                }}
    end

    test "parses TSCH DEL message" do
      assert Orbit.Ocs.Parser.TschMessage.parse(
               {26_377, :tsch, @test_time, ["B", "DEL", "98A8F1AF", "0"]},
               @test_time
             ) ==
               {:ok,
                %Orbit.Ocs.Message.TschDelMessage{
                  counter: 26_377,
                  timestamp: @test_time,
                  transitline: "B",
                  trip_uid: "98A8F1AF",
                  delete_status: :undeleted
                }}
    end

    test "parses TSCH OFF message" do
      assert Orbit.Ocs.Parser.TschMessage.parse(
               {19_332, :tsch, @test_time, ["R", "OFF", "983BA716", "13579"]},
               @test_time
             ) ==
               {:ok,
                %Orbit.Ocs.Message.TschOffMessage{
                  counter: 19_332,
                  timestamp: @test_time,
                  transitline: "R",
                  trip_uid: "983BA716",
                  offset: 13_579
                }}
    end

    test "parses TSCH TAG message" do
      assert Orbit.Ocs.Parser.TschMessage.parse(
               {19_333, :tsch, @test_time,
                [
                  "R",
                  "TAG",
                  "9836C4EE",
                  "543C4CE2",
                  "BDKET",
                  "D1707",
                  " 1706",
                  "K1623",
                  "E1622",
                  "E1511",
                  "E1510"
                ]},
               @test_time
             ) ==
               {:ok,
                %Orbit.Ocs.Message.TschTagMessage{
                  counter: 19_333,
                  timestamp: @test_time,
                  transitline: "R",
                  trip_uid: "9836C4EE",
                  train_uid: "543C4CE2",
                  consist_tags: ["B", "D", "K", "E", "T"],
                  car_tags: [
                    %CarTag{tag: "D", car_number: "1707"},
                    %CarTag{tag: "K", car_number: "1623"},
                    %CarTag{tag: "E", car_number: "1622"},
                    %CarTag{tag: "E", car_number: "1511"},
                    %CarTag{tag: "E", car_number: "1510"}
                  ]
                }}
    end

    test "Red Line 25xx car numbers in TSCH TAG mapped to 15xx" do
      assert Orbit.Ocs.Parser.TschMessage.parse(
               {19_333, :tsch, @test_time,
                [
                  "R",
                  "TAG",
                  "9836C4EE",
                  "543C4CE2",
                  "BDKET",
                  "D1707",
                  " 1706",
                  "K1623",
                  "E1622",
                  "E2511",
                  "E2510"
                ]},
               @test_time
             ) ==
               {:ok,
                %Orbit.Ocs.Message.TschTagMessage{
                  counter: 19_333,
                  timestamp: @test_time,
                  transitline: "R",
                  trip_uid: "9836C4EE",
                  train_uid: "543C4CE2",
                  consist_tags: ["B", "D", "K", "E", "T"],
                  car_tags: [
                    %CarTag{tag: "D", car_number: "1707"},
                    %CarTag{tag: "K", car_number: "1623"},
                    %CarTag{tag: "E", car_number: "1622"},
                    %CarTag{tag: "E", car_number: "1511"},
                    %CarTag{tag: "E", car_number: "1510"}
                  ]
                }}
    end
  end
end
