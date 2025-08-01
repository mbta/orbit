defmodule Orbit.Factory do
  use ExMachina.Ecto, repo: Orbit.Repo

  def user_factory do
    %Orbit.Authentication.User{
      email: sequence(:user_email, &"fake#{&1}@test.com"),
      permissions: [],
      groups: []
    }
  end

  def employee_factory do
    %Orbit.Employee{
      first_name: "Fake",
      preferred_first: "Preferredy",
      last_name: "Person",
      middle_initial: "A",
      email: sequence(:employee_email, &"fake#{&1}@test.com"),
      badge_number: sequence("employee_badge"),
      badge_serials: [],
      area: 321
    }
  end

  def operator_sign_in_factory do
    {:ok, base_dt, 0} = DateTime.from_iso8601("2024-07-02T20:30:00Z")

    %Orbit.OperatorSignIn{
      signed_in_employee: build(:employee),
      signed_in_by_user: build(:user),
      signed_in_at: DateTime.add(base_dt, sequence(:operator_sign_in_time_offset, & &1), :minute),
      rail_line: :blue,
      radio_number: "22",
      sign_in_method: :manual
    }
  end

  def vehicle_position_factory do
    %Realtime.Data.VehiclePosition{
      route_id: :Red,
      revenue: true,
      direction: 0,
      label: "1700",
      position: %Util.Position{latitude: 42.3611328, longitude: -71.0706147},
      station_id: "place-chmnl",
      stop_id: "70073",
      current_status: :STOPPED_AT,
      timestamp: DateTime.from_unix!(1_640_000_000),
      vehicle_id: "R-547210A7"
    }
  end

  def trip_update_factory do
    %Realtime.Data.TripUpdate{
      label: "1700",
      route_id: :Red,
      direction: 0,
      trip_id: "68078228",
      route_pattern_id: "Red-1-0",
      vehicle_id: "R-547210A7",
      timestamp: DateTime.from_unix!(1_640_000_000),
      stop_time_updates: [build(:stop_time_update)]
    }
  end

  def stop_time_update_factory do
    %Realtime.Data.TripUpdate.StopTimeUpdate{
      station_id: "place-chmnl",
      predicted_arrival_time: DateTime.from_unix!(1_640_000_000),
      predicted_departure_time: DateTime.from_unix!(1_640_000_100)
    }
  end

  def tsch_new_factory do
    %Orbit.Ocs.Message.TschNewMessage{
      counter: 123,
      timestamp: DateTime.from_iso8601("2025-07-07T13:00:00.000-04:00") |> elem(1),
      transitline: "R",
      trip_uid: "11111",
      add_type: "S",
      trip_type: "G",
      ocs_route_id: "route-id",
      origin_sta: "origin-station",
      dest_sta: "destination-station",
      prev_trip_uid: "00000",
      next_trip_uid: "22222"
    }
  end

  def tsch_tag_factory do
    alias Orbit.Ocs.Message.TschTagMessage.CarTag

    %Orbit.Ocs.Message.TschTagMessage{
      counter: 123,
      timestamp: DateTime.from_iso8601("2025-07-07T13:00:00.000-04:00") |> elem(1),
      transitline: "R",
      trip_uid: "11111",
      train_uid: "22222",
      consist_tags: ["K", "N"],
      car_tags: [
        %CarTag{
          car_number: "1234",
          tag: "K"
        },
        %CarTag{
          car_number: "1235",
          tag: "K"
        }
      ]
    }
  end

  def trip_factory do
    %Orbit.Ocs.Trip{
      service_date: Date.from_iso8601!("2025-07-07"),
      uid: "11111",
      train_uid: "99999",
      prev_uid: "00000",
      next_uid: "22222",
      route: "route-id",
      rail_line: :red,
      trip_type: "G",
      origin_station: "origin-station",
      destination_station: "destination-station"
    }
  end

  def vehicle_factory do
    %Orbit.Vehicle{
      position: build(:vehicle_position),
      trip_update: build(:trip_update),
      ocs_trips: %{
        current: nil,
        next: []
      }
    }
  end

  def badge_serial_factory do
    %Orbit.BadgeSerial{
      badge_serial: sequence("employee_badge_serial")
    }
  end

  def certification_factory do
    %Orbit.Certification{
      badge: "1234",
      type: :rail,
      rail_line: :blue,
      expires: "2023-12-11"
    }
  end

  def ocs_trip_factory do
    %Orbit.Ocs.Trip{
      service_date: ~D[2025-07-08],
      rail_line: :red,
      uid: "12345678",
      scheduled_departure: ~U[2025-07-08 16:00:00Z],
      scheduled_arrival: ~U[2025-07-08 17:00:00Z],
      origin_station: "ASHMONT",
      destination_station: "ALEWIFE",
      route: "Red",
      offset: 4,
      train_uid: "TRAIN_UID"
    }
  end

  def ocs_train_factory do
    %Orbit.Ocs.Train{
      service_date: ~D[2025-07-08],
      rail_line: :red,
      uid: "5484208E",
      cars: ["1736", "1737", "1724", "1725", "1741", "1740"]
    }
  end

  def vehicle_event_factory do
    %Realtime.Data.VehicleEvent{
      service_date: ~D[2025-07-08],
      rail_line: :red,
      cars: ["1736", "1737", "1724", "1725", "1741", "1740"],
      station_id: "place-asmnl",
      vehicle_id: "5484208E",
      direction_id: 1,
      arrival_departure: :departure,
      timestamp: ~U[2025-07-08 16:05:24Z]
    }
  end
end
