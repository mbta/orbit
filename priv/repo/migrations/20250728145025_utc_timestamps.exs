defmodule Orbit.Repo.Migrations.UtcTimestamps do
  use Ecto.Migration

  @table_names [
    :badge_serials,
    :certifications,
    :employees,
    :kinesis_stream_states,
    :ocs_trains,
    :ocs_trips,
    :operator_sign_ins,
    :users,
    :vehicle_events
  ]
  # The :inserted_at and :updated_at fields originally created by
  # Ecto's timestamps() macro are defaulted to :naive_datetime. We
  # want to update them to use :utc_datetime. In actuality, there should
  # be no underlying change to the table columns, since both are
  # represented the same, ie. stored as UTC but without explicit timezone
  # information. (The only difference is how Ecto casts them when
  # retrieved.) However, for correctness we will still migrate them, in
  # case this behavior changes in a future version of Ecto.
  def change do
    Enum.each(@table_names, fn table_name ->
      alter table(table_name) do
        modify :inserted_at, :utc_datetime, from: :naive_datetime
        modify :updated_at, :utc_datetime, from: :naive_datetime
      end
    end)
  end
end
