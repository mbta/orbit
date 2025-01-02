defmodule Orbit.CertificationTest do
  use Orbit.DataCase

  alias Orbit.Certification
  alias Orbit.Repo

  describe "persistence" do
    test "can insert a certification" do
      Repo.insert!(%Certification{
        badge: "123456789",
        rail_line: :blue,
        type: :rail,
        expires: Date.from_iso8601!("2023-12-11")
      })
    end

    test "cannot violate badge/type/rail_line unique constraint" do
      Repo.insert!(%Certification{
        badge: "123456789",
        type: :rail,
        rail_line: :blue,
        expires: Date.from_iso8601!("2023-12-11")
      })

      assert_raise Ecto.ConstraintError, fn ->
        Repo.insert!(%Certification{
          badge: "123456789",
          type: :rail,
          rail_line: :blue,
          expires: Date.from_iso8601!("2023-12-11")
        })
      end
    end
  end
end
