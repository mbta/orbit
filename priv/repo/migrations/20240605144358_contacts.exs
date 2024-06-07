defmodule Orbit.Repo.Migrations.Contacts do
  use Ecto.Migration

  def change do
    create table(:contacts) do
      add(:first_name, :string)
      add(:middle_initial, :string)
      add(:last_name, :string)
      add(:email_address, :string)
      add(:badge_number, :string)
      add(:area, :integer)
      timestamps()
    end

    create unique_index(:contacts, [:badge_number])

    create(
      constraint(:contacts, :badge_number_no_leading_zeroes,
        check: "NOT starts_with(badge_number, '0')"
      )
    )
  end
end
