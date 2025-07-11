defmodule Orbit.Ocs.SplunkFormatterTest do
  use ExUnit.Case, async: true

  alias Orbit.Ocs.SplunkFormatter

  import Orbit.Factory

  test "formats TSCH_NEW message" do
    message = build(:tsch_new)

    assert SplunkFormatter.format(message) |> IO.iodata_to_binary() ==
             ~s(parsed_ocs_message add_type="S", counter=123, dest_sta="destination-station", next_trip_uid="22222", ocs_route_id="route-id", origin_sta="origin-station", prev_trip_uid="00000", sched_arr=nil, sched_dep=nil, timestamp="2025-07-07T17:00:00.000Z", transitline="R", trip_type="G", trip_uid="11111", type="TSCH_NEW")
  end

  test "formats TSCH_TAG message" do
    message = build(:tsch_tag)

    assert SplunkFormatter.format(message) |> IO.iodata_to_binary() ==
             ~s(parsed_ocs_message car_tags=[{car_number="1234", tag="K"}, {car_number="1235", tag="K"}], consist_tags=["K", "N"], counter=123, timestamp="2025-07-07T17:00:00.000Z", train_uid="22222", transitline="R", trip_uid="11111", type="TSCH_TAG")
  end
end
