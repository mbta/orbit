defmodule Realtime.TripMatcher do
  alias Orbit.Ocs.Trip
  alias Orbit.Vehicle
  alias Realtime.Data.TripUpdate
  alias Realtime.Data.VehiclePosition

  @spec match_trips([VehiclePosition.t()], [TripUpdate.t()], [Trip.t()]) :: [Vehicle.t()]
  def match_trips(vehicle_positions, trip_updates, ocs_trips) do
    Enum.map(vehicle_positions, fn vp ->
      vehicle_id =
        case vp.vehicle_id do
          "O-" <> vehicle_id -> vehicle_id
          "R-" <> vehicle_id -> vehicle_id
          "B-" <> vehicle_id -> vehicle_id
        end

      trip_update =
        Enum.find(trip_updates, fn trip_update ->
          trip_update.trip_id == vp.trip_id
        end)

      ocs_current_and_next =
        Enum.reduce(ocs_trips, %{current: nil, next: []}, fn trip, acc ->
          if trip.train_uid == vehicle_id do
            # credo:disable-for-next-line
            case acc.current do
              nil -> %{current: trip, next: acc.next}
              _ -> %{current: acc.current, next: [trip | acc.next]}
            end
          else
            acc
          end
        end)

      %Vehicle{
        position: vp,
        trip_update: trip_update,
        ocs_trips: ocs_current_and_next
      }
    end)
  end
end
