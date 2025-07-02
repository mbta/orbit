defmodule Orbit.Ocs.ChangeSetTest do
  use Orbit.DataCase

  alias Orbit.Ocs.ChangeSet
  alias Orbit.Ocs.Message.TschNewMessage
  alias Orbit.Ocs.Message.TschConMessage
  alias Orbit.Ocs.Train
  alias Orbit.Ocs.Trip
  alias Orbit.Repo

  @test_service_date Date.new!(2025, 7, 2)
  @test_time Time.new!(16, 48, 0)
  @test_datetime DateTime.new!(
                   @test_service_date,
                   @test_time,
                   Application.compile_env!(:orbit, :timezone)
                 )
  @test_datetime_utc DateTime.from_iso8601("2025-07-02T20:48:00Z")
                     |> then(fn {_, datetime, _} -> datetime end)

  describe("apply_changes") do
    test "inserts trip for TSCH_NEW" do
      message = %TschNewMessage{
        counter: 11111,
        timestamp: @test_datetime,
        transitline: "R",
        trip_uid: "TRIP_UID",
        add_type: "ADD_TYPE",
        trip_type: "TRIP_TYPE",
        sched_dep: @test_datetime,
        sched_arr: @test_datetime,
        ocs_route_id: "OCS_ROUTE_ID",
        origin_sta: "ORIGIN_STA",
        dest_sta: "DEST_STA",
        prev_trip_uid: "PREV_TRIP_UID",
        next_trip_uid: "NEXT_TRIP_UID"
      }

      ChangeSet.apply_changes(message)

      queried =
        Repo.get_by!(
          Trip,
          uid: "TRIP_UID",
          service_date: @test_service_date,
          rail_line: :red
        )

      # TODO: Is there a way to test updated_at timestamps?
      assert %Trip{
               service_date: @test_service_date,
               uid: "TRIP_UID",
               train_uid: nil,
               prev_uid: "PREV_TRIP_UID",
               next_uid: "NEXT_TRIP_UID",
               route: "OCS_ROUTE_ID",
               rail_line: :red,
               trip_type: "TRIP_TYPE",
               scheduled_departure: @test_datetime_utc,
               scheduled_arrival: @test_datetime_utc,
               offset: nil,
               origin_station: "ORIGIN_STA",
               destination_station: "DEST_STA"
             } = queried
    end

    test "inserts trip for TSCH_CON" do
      message = %TschConMessage{
        counter: 11111,
        timestamp: @test_datetime,
        transitline: "R",
        trip_uid: "TRIP_UID",
        consist: ["1515", "1717", "1718"],
        consist_internal: ["2515", "1717", "1718"],
        train_uid: "TRAIN_UID"
      }

      ChangeSet.apply_changes(message)

      queried_trip =
        Repo.get_by!(
          Trip,
          uid: "TRIP_UID",
          service_date: @test_service_date,
          rail_line: :red
        )

      queried_train =
        Repo.get_by!(
          Train,
          uid: "TRAIN_UID",
          service_date: @test_service_date,
          rail_line: :red
        )

      assert %Trip{
               service_date: @test_service_date,
               uid: "TRIP_UID",
               train_uid: "TRAIN_UID",
               rail_line: :red
             } = queried_trip

      assert %Train{
               service_date: @test_service_date,
               uid: "TRAIN_UID",
               rail_line: :red,
               cars: ["1515", "1717", "1718"]
             } = queried_train
    end
  end
end
