defmodule Orbit.Repo.Migrations.AddBadgeSerials do
  use Ecto.Migration

  def change do
    create table("badge_serials") do
      add :employee_id, references("employees", on_delete: :delete_all)
      add :badge_serial, :string

      timestamps()
    end

    create index(:badge_serials, [:badge_serial])

    alter table("operator_sign_ins") do
      modify :signed_in_employee_id, references("employees", on_delete: :delete_all),
        from: references("employees", on_delete: :nothing)

      modify :signed_in_by_user_id, references("users", on_delete: :delete_all),
        from: references("users", on_delete: :nothing)
    end
  end
end
