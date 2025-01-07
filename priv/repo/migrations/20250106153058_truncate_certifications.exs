defmodule Orbit.Repo.Migrations.TruncateCertifications do
  use Ecto.Migration

  def change do
    execute "DELETE FROM certifications"
  end
end
