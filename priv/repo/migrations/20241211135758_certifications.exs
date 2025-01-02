defmodule Orbit.Repo.Migrations.CertificationsTable do
  use Ecto.Migration

  def change do
    create table(:certifications) do
      add(:badge, :string, null: false)
      # Enum
      add(:type, :integer, null: false)
      # Enum
      add(:rail_line, :rail_line)
      add(:expires, :date, null: false)
      timestamps()
    end

    create unique_index(:certifications, [:badge, :type, :rail_line])
  end
end
