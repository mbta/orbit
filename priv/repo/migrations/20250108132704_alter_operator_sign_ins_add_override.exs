defmodule Orbit.Repo.Migrations.SignInOverride do
  use Ecto.Migration

  def change do
    alter table(:operator_sign_ins) do
      add :override, :jsonb
    end
  end
end
