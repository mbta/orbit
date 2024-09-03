defmodule Orbit.Repo.Migrations.AddEmployeesEmailIndex do
  use Ecto.Migration

  def change do
    create index(:employees, [:email])

    # couple of minor stragglers from the contact -> employees rename
    execute(
      "ALTER INDEX contacts_pkey RENAME TO employees_pkey",
      "ALTER INDEX employees_pkey RENAME TO contacts_pkey"
    )

    execute(
      "ALTER INDEX contacts_badge_number_index RENAME TO employees_badge_number_index",
      "ALTER INDEX employees_badge_number_index RENAME TO contacts_badge_number_index"
    )
  end
end
