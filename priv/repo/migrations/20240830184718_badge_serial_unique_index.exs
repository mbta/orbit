defmodule Orbit.Repo.Migrations.BadgeSerialUniqueIndex do
  use Ecto.Migration

  def change do
    execute(
      "DELETE FROM badge_serials a USING badge_serials b WHERE a.id <> b.id AND a.badge_serial = b.badge_serial",
      ""
    )

    drop index(:badge_serials, [:badge_serial])
    create unique_index(:badge_serials, [:badge_serial])
  end
end
