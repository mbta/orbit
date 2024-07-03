defmodule Orbit.Repo.Migrations.AddOperatorSignIns do
  use Ecto.Migration

  def change do
    execute(
      "CREATE TYPE rail_line AS ENUM ('red', 'orange', 'blue')",
      "DROP TYPE rail_line"
    )

    execute("CREATE TYPE sign_in_method AS ENUM ('manual', 'nfc')", "DROP TYPE sign_in_method")

    create table("operator_sign_ins") do
      add :signed_in_employee_id, references("employees")
      add :signed_in_by_user_id, references("users")
      add :signed_in_at, :utc_datetime
      add :rail_line, :rail_line
      add :sign_in_method, :sign_in_method

      timestamps()
    end

    create index(:operator_sign_ins, [:signed_in_employee_id])

    create index(:operator_sign_ins, [:signed_in_by_user_id])

    create index(:operator_sign_ins, [:signed_in_at])
  end
end
