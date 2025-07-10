defmodule Orbit.Ocs.ParserTest do
  use ExUnit.Case, async: true

  alias Orbit.Ocs.Utilities.Time, as: OcsTime

  def get_time_today(msg_time) do
    time = Timex.parse!(msg_time, "{h24}:{m}:{s}")

    today =
      :orbit
      |> Application.get_env(:timezone)
      |> Timex.now()

    Timex.set(today, hour: time.hour, minute: time.minute, second: time.second)
  end

  describe "parse/2" do
    test "parses schedule (TSCH) message" do
      line =
        "3089,TSCH,02:00:08,B,NEW,98A880B8,S,P,05:12,05:32,W946_,ORIENT HEIGHTS YARD,WONDERLAND,0,98A880B9"

      assert Orbit.Ocs.Parser.parse(line, OcsTime.in_ocs_tz(~N[2017-03-17 02:00:08])) ==
               {:ok,
                %Orbit.Ocs.Message.TschNewMessage{
                  add_type: "S",
                  counter: 3089,
                  dest_sta: "WONDERLAND",
                  next_trip_uid: "98A880B9",
                  ocs_route_id: "W946_",
                  origin_sta: "ORIENT HEIGHTS YARD",
                  prev_trip_uid: nil,
                  sched_arr: OcsTime.in_ocs_tz(~N[2017-03-17 05:32:00]),
                  sched_dep: OcsTime.in_ocs_tz(~N[2017-03-17 05:12:00]),
                  timestamp: OcsTime.in_ocs_tz(~N[2017-03-17 02:00:08]),
                  transitline: :blue,
                  trip_type: "P",
                  trip_uid: "98A880B8"
                }}
    end

    test "returns error on unexpected transit line" do
      line =
        "3089,TSCH,02:00:08,X,NEW,98A880B8,S,P,05:12,05:32,W946_,ORIENT HEIGHTS YARD,WONDERLAND,0,98A880B9"

      assert {:error, _} =
               Orbit.Ocs.Parser.parse(line, OcsTime.in_ocs_tz(~N[2017-03-17 02:00:08]))
    end

    test "ignores train movement (TMOV) message" do
      line =
        "11220,TMOV,01:59:59,G,10023,42.336581141538126,-71.25367201212993,1,852,35,  3644,gpsci,3644-3862,0.00,26.69"

      time_today = get_time_today("01:59:59")
      assert Orbit.Ocs.Parser.parse(line, time_today) == {:ok, :ignored}
    end

    test "ignores devi messages" do
      line = "38375,DEVI,05:47:53,R,MD,ALE ATD,1,0"
      time_today = get_time_today("05:47:53")

      assert Orbit.Ocs.Parser.parse(line, time_today) == {:ok, :ignored}
    end

    test "ignores diagnostic (DIAG) messages" do
      line = "1234,DIAG,12:34:56,BROADCAST"
      time_today = get_time_today("12:34:56")

      assert Orbit.Ocs.Parser.parse(line, time_today) == {:ok, :ignored}
    end

    test "ignores raw GPS (RGPS) messages" do
      line = "38357,RGPS,14:24:21,G,U14-182-008,3888,42.367026,-71.106266, 0.00, 184.54"
      time_today = get_time_today("14:24:21")

      assert Orbit.Ocs.Parser.parse(line, time_today) == {:ok, :ignored}
    end

    test "handles empty message" do
      assert Orbit.Ocs.Parser.parse("", Timex.local()) == {:error, %MatchError{term: [""]}}
    end

    test "handles non-integer message counter" do
      assert Orbit.Ocs.Parser.parse(
               "not_an_integer,DEVI,02:04:55,B,SW,WON_SW1,0,1,0,1",
               Timex.local()
             ) ==
               {:error, %MatchError{term: :error}}
    end

    test "handles message type not defined" do
      assert Orbit.Ocs.Parser.parse("4364,NOTD,02:04:55,B,SW,WON_SW1,0,1,0,1", Timex.local()) ==
               {:error,
                %RuntimeError{
                  message: "Message type NOTD did not match any expected message"
                }}
    end

    test "handles message in unexpected format" do
      assert Orbit.Ocs.Parser.parse("4364,,02:04:55,", Timex.local()) ==
               {:error,
                %RuntimeError{
                  message: "Message type  did not match any expected message"
                }}
    end

    test "handles non-time value" do
      assert Orbit.Ocs.Parser.parse(
               "not_an_integer,DEVI,this_is_not_a_time,B,SW,WON_SW1,0,1,0,1",
               Timex.local()
             ) == {:error, %MatchError{term: :error}}
    end
  end

  describe "convert_ocs_car_number/2" do
    test "converts Red Line 25xx car number to 15xx" do
      assert Orbit.Ocs.Parser.convert_ocs_car_number(:red, "2501") == "1501"
    end

    test "doesn't convert other line 25xx car number to 15xx" do
      assert Orbit.Ocs.Parser.convert_ocs_car_number(:orange, "2501") == "2501"
    end
  end
end
