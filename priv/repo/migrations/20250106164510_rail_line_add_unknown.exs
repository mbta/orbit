defmodule Orbit.Repo.Migrations.CertificationRailLineUnknown do
  use Ecto.Migration

  def change do
    execute "ALTER TYPE rail_line ADD VALUE 'none';"

    alter table(:certifications) do
      modify :rail_line, :rail_line, null: false
    end
  end
end
