defmodule Orbit.Repo.Migrations.AddUserPermissionsColumn do
  use Ecto.Migration

  def change do
    execute(
      "CREATE TYPE user_permission AS ENUM ('operator_sign_in')",
      "DROP TYPE user_permission"
    )

    alter table("users") do
      add :permissions, {:array, :user_permission}, null: false, default: []
    end
  end
end
