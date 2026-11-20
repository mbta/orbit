defmodule Orbit.Repo.Migrations.ClearOcsTrips1120 do
  use Ecto.Migration

  def change do
    execute "DELETE FROM ocs_trips WHERE service_date = '2026-11-20';"
    execute "DELETE FROM kinesis_stream_states;"
  end
end
