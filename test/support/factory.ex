defmodule Orbit.Factory do
  use ExMachina.Ecto, repo: Orbit.Repo

  def user_factory do
    %Orbit.Authentication.User{
      email: sequence(:user_email, &"fake#{&1}@test.com"),
      permissions: []
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
end
