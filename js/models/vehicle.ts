import { TripUpdate } from "./tripUpdate";
import { VehiclePosition } from "./vehiclePosition";

export type Vehicle = {
  vehiclePosition: VehiclePosition;
  tripUpdate?: TripUpdate;
};

export const vehiclesFromPositionsAndTripUpdates = (
  vehiclePositions: VehiclePosition[],
  tripUpdates: TripUpdate[],
): Vehicle[] => {
  const tripUpdateById = new Map<string, TripUpdate>();
  for (const tripUpdate of tripUpdates) {
    const existing = tripUpdateById.get(tripUpdate.tripId);
    if (existing) {
      console.error("Multiple updates for trip. Overwriting");
      console.error(existing);
    }
    tripUpdateById.set(tripUpdate.tripId, tripUpdate);
  }

  return vehiclePositions.map((vehiclePosition) => {
    const tripId = vehiclePosition.tripId;
    const tripUpdate = tripId != null ? tripUpdateById.get(tripId) : undefined;
    return {
      vehiclePosition,
      tripUpdate,
    };
  });
};
