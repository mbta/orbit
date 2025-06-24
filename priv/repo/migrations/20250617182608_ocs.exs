defmodule Orbit.Repo.Migrations.OCSTables do
  use Ecto.Migration

  def change do
    create table(:ocs_trips) do
      add(:service_date, :date, null: false)
      add(:uid, :string, null: false)
      add(:train_uid, :string)
      add(:prev_uid, :string)
      add(:next_uid, :string)
      add(:route, :string)
      add(:rail_line, :rail_line, null: false)
      add(:trip_type, :string)
      add(:scheduled_departure, :utc_datetime)
      add(:scheduled_arrival, :utc_datetime)
      add(:offset, :integer)
      add(:origin_station, :string)
      add(:destination_station, :string)
      add(:deleted, :boolean)

      timestamps()
    end

    create unique_index(:ocs_trips, [:service_date, :uid, :rail_line])
    create index(:ocs_trips, [:service_date, :rail_line, :train_uid])

    create table(:ocs_trains) do
      add(:service_date, :date, null: false)
      add(:uid, :string, null: false)
      add(:rail_line, :rail_line, null: false)
      add(:cars, :jsonb)
      add(:tags, :jsonb)
      add(:deleted, :boolean)

      timestamps()
    end

    create unique_index(:ocs_trains, [:service_date, :uid, :rail_line])
  end
end
