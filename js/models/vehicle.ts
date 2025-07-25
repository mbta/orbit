import { OCSTrip, OCSTripData, ocsTripFromData } from "./ocs";
import { TripUpdate, TripUpdateData, tripUpdateFromData } from "./tripUpdate";
import {
  VehiclePosition,
  VehiclePositionData,
  vehiclePositionFromData,
} from "./vehiclePosition";
import z from "zod";

export type Vehicle = {
  vehiclePosition: VehiclePosition;
  tripUpdate?: TripUpdate;
  ocsTrips: {
    current: OCSTrip | null;
    next: OCSTrip[];
  };
};

export const VehicleData = z.object({
  position: VehiclePositionData,
  trip_update: TripUpdateData.nullable(),
  ocs_trips: z.object({
    current: OCSTripData.nullable(),
    next: z.array(OCSTripData),
  }),
});
export type VehicleData = z.infer<typeof VehicleData>;

export const VehicleDataMessage = z.object({
  data: z.object({
    timestamp: z.number(),
    entities: z.array(VehicleData),
  }),
});
export type VehicleDataMessage = z.infer<typeof VehicleDataMessage>;

export const vehicleFromVehicleData = (vehicleData: VehicleData): Vehicle => {
  return {
    vehiclePosition: vehiclePositionFromData(vehicleData.position),
    tripUpdate:
      vehicleData.trip_update !== null ?
        tripUpdateFromData(vehicleData.trip_update)
      : undefined,
    ocsTrips: {
      current:
        vehicleData.ocs_trips.current !== null ?
          ocsTripFromData(vehicleData.ocs_trips.current)
        : null,
      next: vehicleData.ocs_trips.next.map(ocsTripFromData),
    },
  };
};

export const estimatedArrivalOfVehicle = (vehicle: Vehicle) => {
  const tripUpdate = vehicle.tripUpdate;
  const stu =
    tripUpdate?.stopTimeUpdates[tripUpdate.stopTimeUpdates.length - 1];
  return stu?.predictedArrivalTime;
};
