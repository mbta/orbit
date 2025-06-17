defmodule Orbit.Ocs.TripTest do
  use Orbit.DataCase

  alias Orbit.Ocs.Trip

  test "create" do
    %Trip{
      service_date: Util.Time.current_service_date(),
      rail_line: :red,
      uid: "9814A64F"
    }
  end

  test "insert into the database" do
    %Trip{
      service_date: Util.Time.current_service_date(),
      rail_line: :red,
      uid: "9814A64F"
    }
    |> Trip.changeset()
    |> Repo.insert!()
  end

  test "upsert with train UID into the database" do
    %Trip{
      service_date: Util.Time.current_service_date(),
      rail_line: :red,
      uid: "9814A64F"
    }
    |> Trip.changeset()
    |> Repo.insert!()

    %Trip{
      service_date: Util.Time.current_service_date(),
      rail_line: :red,
      uid: "9814A64F",
      train_uid: "TRAIN_UID"
    }
    |> Trip.changeset()
    |> Repo.insert!(on_conflict: :replace_all, conflict_target: [:service_date, :rail_line, :uid])
  end

  test "unique constraint on service_date, uid, rail_line" do
    today = Util.Time.current_service_date()

    %Trip{
      service_date: today,
      rail_line: :red,
      uid: "9814A64F"
    }
    |> Trip.changeset()
    |> Repo.insert!()

    %Trip{
      service_date: today,
      rail_line: :blue,
      uid: "9814A64F"
    }
    |> Trip.changeset()
    |> Repo.insert!()

    assert_raise Ecto.InvalidChangesetError,
                 fn ->
                   %Trip{
                     service_date: today,
                     rail_line: :red,
                     uid: "9814A64F"
                   }
                   |> Trip.changeset()
                   |> Repo.insert!()
                 end
  end

  test "changeset enforces non-null constraints" do
    # null service_date
    assert %{valid?: false} =
             %Trip{
               rail_line: :red,
               uid: "9814A64F"
             }
             |> Trip.changeset()

    # null rail_line
    assert %{valid?: false} =
             %Trip{
               service_date: Util.Time.current_service_date(),
               uid: "9814A64F"
             }
             |> Trip.changeset()

    # null uid
    assert %{valid?: false} =
             %Trip{
               rail_line: :red,
               service_date: Util.Time.current_service_date()
             }
             |> Trip.changeset()
  end

  test "database enforces non-null constraints" do
    # null service_date
    assert_raise Postgrex.Error, fn ->
      Repo.insert!(%Trip{
        rail_line: :red,
        uid: "9814A64F"
      })
    end

    # null rail_line
    assert_raise Postgrex.Error, fn ->
      Repo.insert!(%Trip{
        service_date: Util.Time.current_service_date(),
        uid: "9814A64F"
      })
    end

    # null uid
    assert_raise Postgrex.Error, fn ->
      Repo.insert!(%Trip{
        rail_line: :red,
        service_date: Util.Time.current_service_date()
      })
    end
  end
end
