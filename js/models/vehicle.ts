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
};

export const VehicleData = z.object({
  position: VehiclePositionData,
  trip_update: TripUpdateData.nullable(),
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
  };
};
