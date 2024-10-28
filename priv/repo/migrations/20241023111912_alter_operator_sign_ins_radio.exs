defmodule Orbit.Repo.Migrations.AlterSigninsRadio do
  use Ecto.Migration

  def change do
    alter table(:operator_sign_ins) do
      add :radio_number, :string
    end
  end
end
