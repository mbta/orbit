defmodule Orbit.Repo.Migrations.Kinesis do
  use Ecto.Migration

  def change do
    create table(:kinesis_stream_states) do
      add(:stream_name, :string, null: false)
      add(:resume_position, :string, null: false)
      add(:last_message_timestamp, :utc_datetime)

      timestamps()
    end

    create unique_index(:kinesis_stream_states, :stream_name)
  end
end
