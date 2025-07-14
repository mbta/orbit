defmodule Orbit.Repo.Migrations.OcsAlterTripAssignedAtColumn do
  use Ecto.Migration

  def change do
    alter table(:ocs_trips) do
      add :assigned_at, :utc_datetime
    end
  end
end
