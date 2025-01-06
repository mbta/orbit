defmodule Orbit.Repo.Migrations.CertificationRailLineUnknown do
  use Ecto.Migration

  def change do
    execute "ALTER TYPE rail_line ADD VALUE 'none';"
  end
end
