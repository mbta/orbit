defmodule Orbit.Ocs.EntitiesTest do
  use Orbit.DataCase

  alias Orbit.Ocs.Entities
  alias Orbit.Ocs.Message
  alias Orbit.Ocs.Train
  alias Orbit.Ocs.Trip
  alias Orbit.Repo

  @test_timezone Application.compile_env!(:orbit, :timezone)
  @test_service_date Date.new!(2025, 7, 2)
  @test_time Time.new!(16, 48, 0)
  @test_datetime DateTime.new!(
                   @test_service_date,
                   @test_time,
                   @test_timezone
                 )
  @test_datetime_utc DateTime.from_iso8601("2025-07-02T20:48:00Z") |> elem(1)

  setup do
    # Insert initial trip and train for testing upserts
    %Trip{
      service_date: @test_service_date,
      uid: "TRIP_UID",
      rail_line: :red,
      train_uid: "TRAIN_UID",
      prev_uid: "PREV_UID",
      next_uid: "NEXT_UID",
      route: "ROUTE",
      offset: 0,
      origin_station: "ORIGIN_STATION",
      destination_station: "DESTINATION_STATION"
    }
    |> Trip.changeset()
    |> Repo.insert()

    %Train{
      service_date: @test_service_date,
      uid: "TRAIN_UID",
      rail_line: :red,
      tags: ["K"],
      cars: ["1234", "1235", "1236"],
      car_tags: ["", "", "K"]
    }
    |> Train.changeset()
    |> Repo.insert()

    :ok
  end

  describe("apply_changes") do
    test "upserts trip for TSCH_NEW" do
      message = %Message.TschNewMessage{
        counter: 111,
        timestamp: @test_datetime,
        transitline: :red,
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

      Entities.apply_changes(message)

      queried =
        Repo.get_by!(
          Trip,
          uid: "TRIP_UID",
          service_date: @test_service_date,
          rail_line: :red
        )

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
               # Scheduled endpoints from setup are preserved; new values from
               # the TSCH_NEW go to the updated columns because they differ.
               origin_station: "ORIGIN_STATION",
               origin_station_updated: "ORIGIN_STA",
               destination_station: "DESTINATION_STATION",
               destination_station_updated: "DEST_STA"
             } = queried
    end

    test "TSCH_NEW with changed endpoints preserves scheduled stations and records updates" do
      message = %Message.TschNewMessage{
        counter: 112,
        timestamp: @test_datetime,
        transitline: :red,
        trip_uid: "TRIP_UID",
        add_type: "S",
        trip_type: "TRIP_TYPE",
        sched_dep: @test_datetime,
        sched_arr: @test_datetime,
        ocs_route_id: "OCS_ROUTE_ID",
        origin_sta: "ORIGIN_STATION_2",
        dest_sta: "DESTINATION_STATION_2",
        prev_trip_uid: "PREV_TRIP_UID",
        next_trip_uid: "NEXT_TRIP_UID"
      }

      Entities.apply_changes(message)

      queried =
        Repo.get_by!(
          Trip,
          uid: "TRIP_UID",
          service_date: @test_service_date,
          rail_line: :red
        )

      assert %Trip{
               origin_station: "ORIGIN_STATION",
               origin_station_updated: "ORIGIN_STATION_2",
               destination_station: "DESTINATION_STATION",
               destination_station_updated: "DESTINATION_STATION_2"
             } = queried
    end

    test "TSCH_NEW replayed with scheduled endpoints leaves updated columns null" do
      message = %Message.TschNewMessage{
        counter: 113,
        timestamp: @test_datetime,
        transitline: :red,
        trip_uid: "TRIP_UID",
        add_type: "S",
        trip_type: "TRIP_TYPE",
        sched_dep: @test_datetime,
        sched_arr: @test_datetime,
        ocs_route_id: "OCS_ROUTE_ID",
        origin_sta: "ORIGIN_STATION",
        dest_sta: "DESTINATION_STATION",
        prev_trip_uid: "PREV_TRIP_UID",
        next_trip_uid: "NEXT_TRIP_UID"
      }

      Entities.apply_changes(message)

      queried =
        Repo.get_by!(
          Trip,
          uid: "TRIP_UID",
          service_date: @test_service_date,
          rail_line: :red
        )

      assert %Trip{
               origin_station: "ORIGIN_STATION",
               origin_station_updated: nil,
               destination_station: "DESTINATION_STATION",
               destination_station_updated: nil
             } = queried
    end

    test "TSCH_NEW reverting to scheduled endpoints clears updated columns" do
      changed = %Message.TschNewMessage{
        counter: 114,
        timestamp: @test_datetime,
        transitline: :red,
        trip_uid: "TRIP_UID",
        add_type: "S",
        trip_type: "TRIP_TYPE",
        sched_dep: @test_datetime,
        sched_arr: @test_datetime,
        ocs_route_id: "OCS_ROUTE_ID",
        origin_sta: "ORIGIN_STATION_2",
        dest_sta: "DESTINATION_STATION_2",
        prev_trip_uid: "PREV_TRIP_UID",
        next_trip_uid: "NEXT_TRIP_UID"
      }

      Entities.apply_changes(changed)

      Entities.apply_changes(%{
        changed
        | origin_sta: "ORIGIN_STATION",
          dest_sta: "DESTINATION_STATION"
      })

      queried =
        Repo.get_by!(
          Trip,
          uid: "TRIP_UID",
          service_date: @test_service_date,
          rail_line: :red
        )

      assert %Trip{
               origin_station: "ORIGIN_STATION",
               origin_station_updated: nil,
               destination_station: "DESTINATION_STATION",
               destination_station_updated: nil
             } = queried
    end

    test "TSCH_NEW populates scheduled endpoints on a trip that has none yet" do
      %Trip{
        service_date: @test_service_date,
        uid: "BARE_TRIP_UID",
        rail_line: :red,
        train_uid: "TRAIN_UID"
      }
      |> Trip.changeset()
      |> Repo.insert!()

      message = %Message.TschNewMessage{
        counter: 115,
        timestamp: @test_datetime,
        transitline: :red,
        trip_uid: "BARE_TRIP_UID",
        add_type: "S",
        trip_type: "TRIP_TYPE",
        sched_dep: @test_datetime,
        sched_arr: @test_datetime,
        ocs_route_id: "OCS_ROUTE_ID",
        origin_sta: "ORIGIN_STA",
        dest_sta: "DEST_STA",
        prev_trip_uid: nil,
        next_trip_uid: nil
      }

      Entities.apply_changes(message)

      queried =
        Repo.get_by!(
          Trip,
          uid: "BARE_TRIP_UID",
          service_date: @test_service_date,
          rail_line: :red
        )

      assert %Trip{
               origin_station: "ORIGIN_STA",
               origin_station_updated: nil,
               destination_station: "DEST_STA",
               destination_station_updated: nil
             } = queried
    end

    test "TSCH_NEW with no endpoint values preserves scheduled and updated endpoints" do
      changed = %Message.TschNewMessage{
        counter: 116,
        timestamp: @test_datetime,
        transitline: :red,
        trip_uid: "TRIP_UID",
        add_type: "S",
        trip_type: "TRIP_TYPE",
        sched_dep: @test_datetime,
        sched_arr: @test_datetime,
        ocs_route_id: "OCS_ROUTE_ID",
        origin_sta: "ORIGIN_STATION_2",
        dest_sta: "DESTINATION_STATION_2",
        prev_trip_uid: "PREV_TRIP_UID",
        next_trip_uid: "NEXT_TRIP_UID"
      }

      Entities.apply_changes(changed)
      Entities.apply_changes(%{changed | origin_sta: nil, dest_sta: nil})

      queried =
        Repo.get_by!(
          Trip,
          uid: "TRIP_UID",
          service_date: @test_service_date,
          rail_line: :red
        )

      assert %Trip{
               origin_station: "ORIGIN_STATION",
               origin_station_updated: "ORIGIN_STATION_2",
               destination_station: "DESTINATION_STATION",
               destination_station_updated: "DESTINATION_STATION_2"
             } = queried
    end

    test "inserts trip for TSCH_CON" do
      message = %Message.TschConMessage{
        counter: 111,
        timestamp: @test_datetime,
        transitline: :red,
        trip_uid: "TRIP_UID",
        consist: ["1515", "1717", "1718"],
        train_uid: "TRAIN_UID"
      }

      Entities.apply_changes(message)

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
               rail_line: :red,
               # Check that other fields still exist
               route: "ROUTE"
             } = queried_trip

      assert %Train{
               service_date: @test_service_date,
               uid: "TRAIN_UID",
               rail_line: :red,
               tags: ["K"],
               cars: ["1515", "1717", "1718"]
               # Should this wipe out car tags?
             } = queried_train
    end

    test "upserts trip for TSCH_ASN" do
      message = %Message.TschAsnMessage{
        counter: 111,
        timestamp: @test_datetime,
        transitline: :red,
        train_uid: "TRAIN_UID_2",
        trip_uid: "TRIP_UID"
      }

      Entities.apply_changes(message)

      queried_trip =
        Repo.get_by!(
          Trip,
          uid: "TRIP_UID",
          service_date: @test_service_date,
          rail_line: :red
        )

      assert %Trip{
               service_date: @test_service_date,
               uid: "TRIP_UID",
               train_uid: "TRAIN_UID_2",
               assigned_at: @test_datetime_utc,
               rail_line: :red,
               # Check that other fields still exist
               route: "ROUTE"
             } = queried_trip
    end

    test "no-op for TSCH_RLD" do
      message = %Message.TschRldMessage{
        counter: 111,
        timestamp: @test_datetime,
        transitline: :red
      }

      assert [{:ok, :noop}] = Entities.apply_changes(message)
    end

    test "upserts trip for TSCH_DST" do
      timestamp_utc = DateTime.from_iso8601("2025-07-02T21:48:00Z") |> elem(1)
      timestamp_local = DateTime.shift_zone!(timestamp_utc, @test_timezone)

      message = %Message.TschDstMessage{
        counter: 111,
        timestamp: @test_datetime,
        transitline: :red,
        trip_uid: "TRIP_UID",
        dest_sta: "DESTINATION_STATION_2",
        ocs_route_id: "ROUTE_2",
        sched_arr: timestamp_local
      }

      Entities.apply_changes(message)

      queried_trip =
        Repo.get_by!(
          Trip,
          uid: "TRIP_UID",
          service_date: @test_service_date,
          rail_line: :red
        )

      assert %Trip{
               service_date: @test_service_date,
               uid: "TRIP_UID",
               rail_line: :red,
               # The scheduled destination is preserved; the dispatcher's
               # updated destination goes to destination_station_updated
               destination_station: "DESTINATION_STATION",
               destination_station_updated: "DESTINATION_STATION_2",
               route: "ROUTE_2",
               scheduled_arrival: ^timestamp_utc,
               # Check that other fields still exist
               offset: 0
             } = queried_trip
    end

    test "TSCH_DST with the scheduled destination leaves updated column null" do
      message = %Message.TschDstMessage{
        counter: 111,
        timestamp: @test_datetime,
        transitline: :red,
        trip_uid: "TRIP_UID",
        dest_sta: "DESTINATION_STATION",
        ocs_route_id: "ROUTE_2",
        sched_arr: @test_datetime
      }

      Entities.apply_changes(message)

      queried_trip =
        Repo.get_by!(
          Trip,
          uid: "TRIP_UID",
          service_date: @test_service_date,
          rail_line: :red
        )

      assert %Trip{
               destination_station: "DESTINATION_STATION",
               destination_station_updated: nil
             } = queried_trip
    end

    test "TSCH_DST reverting to the scheduled destination clears updated column" do
      message = %Message.TschDstMessage{
        counter: 111,
        timestamp: @test_datetime,
        transitline: :red,
        trip_uid: "TRIP_UID",
        dest_sta: "DESTINATION_STATION_2",
        ocs_route_id: "ROUTE_2",
        sched_arr: @test_datetime
      }

      Entities.apply_changes(message)

      queried_trip =
        Repo.get_by!(
          Trip,
          uid: "TRIP_UID",
          service_date: @test_service_date,
          rail_line: :red
        )

      assert %Trip{destination_station_updated: "DESTINATION_STATION_2"} = queried_trip

      Entities.apply_changes(%{message | dest_sta: "DESTINATION_STATION"})

      queried_trip =
        Repo.get_by!(
          Trip,
          uid: "TRIP_UID",
          service_date: @test_service_date,
          rail_line: :red
        )

      assert %Trip{
               destination_station: "DESTINATION_STATION",
               destination_station_updated: nil
             } = queried_trip
    end

    test "TSCH_DST for a new trip records the destination as scheduled" do
      message = %Message.TschDstMessage{
        counter: 111,
        timestamp: @test_datetime,
        transitline: :red,
        trip_uid: "NEW_TRIP_UID",
        dest_sta: "DEST_STA",
        ocs_route_id: "ROUTE",
        sched_arr: @test_datetime
      }

      Entities.apply_changes(message)

      queried_trip =
        Repo.get_by!(
          Trip,
          uid: "NEW_TRIP_UID",
          service_date: @test_service_date,
          rail_line: :red
        )

      assert %Trip{
               destination_station: "DEST_STA",
               destination_station_updated: nil
             } = queried_trip
    end

    test "upserts trip for TSCH_DEL (marks deleted)" do
      message = %Message.TschDelMessage{
        counter: 111,
        timestamp: @test_datetime,
        transitline: :red,
        trip_uid: "TRIP_UID",
        delete_status: :deleted
      }

      Entities.apply_changes(message)

      queried_trip =
        Repo.get_by!(
          Trip,
          uid: "TRIP_UID",
          service_date: @test_service_date,
          rail_line: :red
        )

      assert %Trip{
               service_date: @test_service_date,
               uid: "TRIP_UID",
               rail_line: :red,
               deleted: true,
               # Check that other fields still exist
               route: "ROUTE"
             } = queried_trip
    end

    test "upserts trip for TSCH_DEL (marks undeleted)" do
      message = %Message.TschDelMessage{
        counter: 111,
        timestamp: @test_datetime,
        transitline: :red,
        trip_uid: "TRIP_UID",
        delete_status: :undeleted
      }

      Entities.apply_changes(message)

      queried_trip =
        Repo.get_by!(
          Trip,
          uid: "TRIP_UID",
          service_date: @test_service_date,
          rail_line: :red
        )

      assert %Trip{
               service_date: @test_service_date,
               uid: "TRIP_UID",
               rail_line: :red,
               deleted: false,
               # Check that other fields still exist
               route: "ROUTE"
             } = queried_trip
    end

    test "upserts trip for TSCH_LNK" do
      message = %Message.TschLnkMessage{
        counter: 111,
        timestamp: @test_datetime,
        transitline: :red,
        trip_uid: "TRIP_UID",
        prev_trip_uid: "PREV_TRIP_UID_2",
        next_trip_uid: "NEXT_TRIP_UID_2"
      }

      Entities.apply_changes(message)

      queried_trip =
        Repo.get_by!(
          Trip,
          uid: "TRIP_UID",
          service_date: @test_service_date,
          rail_line: :red
        )

      assert %Trip{
               service_date: @test_service_date,
               uid: "TRIP_UID",
               rail_line: :red,
               prev_uid: "PREV_TRIP_UID_2",
               next_uid: "NEXT_TRIP_UID_2",
               # Check that other fields still exist
               route: "ROUTE"
             } = queried_trip
    end

    test "upserts trip for TSCH_OFF" do
      message = %Message.TschOffMessage{
        counter: 111,
        timestamp: @test_datetime,
        transitline: :red,
        trip_uid: "TRIP_UID",
        offset: 15
      }

      Entities.apply_changes(message)

      queried_trip =
        Repo.get_by!(
          Trip,
          uid: "TRIP_UID",
          service_date: @test_service_date,
          rail_line: :red
        )

      assert %Trip{
               service_date: @test_service_date,
               uid: "TRIP_UID",
               rail_line: :red,
               offset: 15,
               # Check that other fields still exist
               route: "ROUTE"
             } = queried_trip
    end

    test "upserts trip and train for TSCH_TAG" do
      message = %Message.TschTagMessage{
        counter: 111,
        timestamp: @test_datetime,
        transitline: :red,
        trip_uid: "TRIP_UID_2",
        train_uid: "TRAIN_UID",
        consist_tags: ["D", "N"],
        car_tags: [
          %Message.TschTagMessage.CarTag{
            car_number: "1237",
            tag: "D"
          },
          %Message.TschTagMessage.CarTag{
            car_number: "1238",
            tag: "D"
          },
          %Message.TschTagMessage.CarTag{
            car_number: "1239",
            tag: nil
          }
        ]
      }

      Entities.apply_changes(message)

      queried_train =
        Repo.get_by!(
          Train,
          uid: "TRAIN_UID",
          service_date: @test_service_date,
          rail_line: :red,
          tags: ["D", "N"],
          cars: ["1237", "1238", "1239"],
          car_tags: ["D", "D", ""]
        )

      assert %Train{
               service_date: @test_service_date,
               uid: "TRAIN_UID",
               rail_line: :red
             } = queried_train

      queried_trip =
        Repo.get_by!(
          Trip,
          uid: "TRIP_UID_2",
          service_date: @test_service_date,
          rail_line: :red
        )

      assert %Trip{
               service_date: @test_service_date,
               uid: "TRIP_UID_2",
               rail_line: :red,
               train_uid: "TRAIN_UID"
             } = queried_trip
    end
  end
end
