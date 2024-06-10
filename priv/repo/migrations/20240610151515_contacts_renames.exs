defmodule Orbit.Repo.Migrations.ContactsRenames do
  use Ecto.Migration

  def up do
    rename table(:contacts), to: table(:employees)
    execute "ALTER SEQUENCE contacts_id_seq RENAME TO employees_id_seq;"
    rename table(:employees), :email_address, to: :email
  end

  def down do
    rename table(:employees), :email, to: :email_address
    execute "ALTER SEQUENCE employees_id_seq RENAME TO contacts_id_seq;"
    rename table(:employees), to: table(:contacts)
  end
end
