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
      radio_number: 22,
      sign_in_method: :manual
    }
  end

  def badge_serial_factory do
    %Orbit.BadgeSerial{
      badge_serial: sequence("employee_badge_serial")
    }
  end
end
