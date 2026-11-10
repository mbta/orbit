defmodule Orbit.Ocs.UidCache do
  alias Orbit.Ocs
  alias Orbit.Repo
  import Ecto.Query

  alias Orbit.Ocs.Entities

  @typedoc "Caches OCS trips for carryover to subsequent service days (up to TTL)"
  @type t :: %{(trip_uid :: String.t()) => service_date :: Date.t()}

  @spec initialize(Date.t()) :: t()
  def initialize(now_service_date) do
    horizon = Date.add(now_service_date, -Entities.trip_uid_ttl_d())

    Repo.all(
      from(trip in Ocs.Trip,
        where: trip.service_date >= ^horizon,
        group_by: trip.uid,
        select: {trip.uid, min(trip.service_date)}
      )
    )
    |> Map.new()
  end

  @spec prune(t(), Date.t()) :: t()
  def prune(cache, now_service_date) do
    Map.filter(cache, fn {_uid, service_date} ->
      Date.diff(service_date, now_service_date) >= -Entities.trip_uid_ttl_d()
    end)
  end
end
