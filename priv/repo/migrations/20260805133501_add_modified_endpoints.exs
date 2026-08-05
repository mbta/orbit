defmodule Orbit.Repo.Migrations.AddModifiedEndpoints do
  use Ecto.Migration

  def change do
    alter table("ocs_trips") do
      add :origin_station_updated, :string, null: true
      add :destination_station_updated, :string, null: true
    end
  end
end
