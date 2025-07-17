defmodule Orbit.Repo.Migrations.VehicleEvents do
  use Ecto.Migration

  def change do
    create_query = "CREATE TYPE arrival_departure AS ENUM ('arrival', 'departure')"
    drop_query = "DROP TYPE arrival_departure"
    execute(create_query, drop_query)

    create table(:vehicle_events) do
      add(:service_date, :date, null: false)
      add(:cars, :jsonb, null: false)
      add(:station_id, :string, null: false)
      add(:vehicle_id, :string, null: false)
      add(:direction_id, :integer, null: false)
      add(:rail_line, :rail_line, null: false)
      add(:arrival_departure, :arrival_departure, null: false)
      add(:timestamp, :utc_datetime, null: false)

      timestamps()
    end

    create index(:vehicle_events, [:service_date, :station_id])
  end
end
