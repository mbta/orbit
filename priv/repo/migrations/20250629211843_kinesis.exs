defmodule Orbit.Repo.Migrations.Kinesis do
  use Ecto.Migration

  def change do
    create table(:kinesis_streams) do
      add(:stream_name, :string, null: false)
      add(:resume_position, :string, null: false)

      timestamps()
    end

    create unique_index(:kinesis_streams, :stream_name)
  end
end
