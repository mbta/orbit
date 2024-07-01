defmodule Orbit.Repo.Migrations.EmployeesPreferredFirst do
  use Ecto.Migration

  def change do
    alter table(:employees) do
      add :preferred_first, :string
    end
  end
end
