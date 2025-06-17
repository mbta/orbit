defmodule Orbit.Ocs.TrainTest do
  use Orbit.DataCase

  alias Orbit.Ocs.Train

  test "create" do
    %Train{
      service_date: Util.Time.current_service_date(),
      rail_line: :red,
      uid: "TRAIN_UID",
      cars: ["1877", "1876", "1811", "1812", "1808", "1809"],
      tags: ["K", "K", "K", "", "", ""]
    }
  end

  test "insert into the database" do
    %Train{
      service_date: Util.Time.current_service_date(),
      rail_line: :red,
      uid: "TRAIN_UID",
      cars: ["1877", "1876", "1811", "1812", "1808", "1809"],
      tags: ["K", "K", "K", "", "", ""]
    }
    |> Train.changeset()
    |> Repo.insert!()
  end

  test "upsert" do
    %Train{
      service_date: Util.Time.current_service_date(),
      rail_line: :red,
      uid: "TRAIN_UID",
      cars: ["1877", "1876", "1811", "1812", "1808", "1809"]
    }
    |> Train.changeset()
    |> Repo.insert!()

    %Train{
      service_date: Util.Time.current_service_date(),
      rail_line: :red,
      uid: "TRAIN_UID",
      cars: ["1877", "1876", "1811", "1812", "1808", "1810"],
      tags: ["K", "K", "K", "", "", ""]
    }
    |> Train.changeset()
    |> Repo.insert!(on_conflict: :replace_all, conflict_target: [:service_date, :uid, :rail_line])
  end

  test "unique constraint on service_date, uid, rail_line" do
    %Train{
      service_date: Util.Time.current_service_date(),
      rail_line: :red,
      uid: "TRAIN_UID",
      cars: ["1877", "1876", "1811", "1812", "1808", "1809"]
    }
    |> Train.changeset()
    |> Repo.insert!()

    assert_raise Ecto.InvalidChangesetError, fn ->
      %Train{
        service_date: Util.Time.current_service_date(),
        rail_line: :red,
        uid: "TRAIN_UID",
        cars: ["1877", "1876", "1811", "1812", "1808", "1809"]
      }
      |> Train.changeset()
      |> Repo.insert!()
    end
  end
end
