import { OCSTrip, OCSTripData, ocsTripFromData } from "./ocs";
import {
  estimatedArrival,
  TripUpdate,
  TripUpdateData,
  tripUpdateFromData,
} from "./tripUpdate";
import {
  VehiclePosition,
  VehiclePositionData,
  vehiclePositionFromData,
} from "./vehiclePosition";
import { DateTime } from "luxon";
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

const minutesAfter = (event: DateTime, base: DateTime) => {
  // + = event later than base
  return event.diff(base, "minutes").minutes;
};

const getEffectiveTime = (
  scheduled: DateTime | null,
  offset: number | null,
) => {
  if (scheduled === null) {
    return null;
  }

  if (offset === null) {
    return scheduled;
  }

  return scheduled.plus({ minutes: offset });
};

/**
 * late
 * @param vehicle
 * @returns Actual departure - scheduled departure in minutes. + = left late.
 */
export const lateDeparture = (vehicle: Vehicle): number | null => {
  const offset = vehicle.ocsTrips.current?.offset ?? null;
  const originalScheduled =
    vehicle.ocsTrips.current?.scheduledDeparture ?? null;

  const scheduled = getEffectiveTime(originalScheduled, offset);
  const actual = vehicle.ocsTrips.current?.actualDeparture ?? null;

  if (scheduled === null || actual === null) {
    return null;
  }
  return minutesAfter(actual, scheduled);
};

/**
 * late
 * @param vehicle
 * @returns Estimated time - scheduled time in minutes. + = arriving late.
 */
export const lateArrival = (vehicle: Vehicle): number | null => {
  const scheduled = vehicle.ocsTrips.current?.scheduledArrival;
  const estimated = estimatedArrival(vehicle.tripUpdate);

  if (scheduled === null || scheduled === undefined || estimated === null) {
    return null;
  }
  return minutesAfter(estimated, scheduled);
};

/**
 * lateForNext
 * @param vehicle
 * @returns Estimated time - next departure in minutes. + = cannot make the next on time.
 */
export const lateForNext = (vehicle: Vehicle): number | null => {
  const nextTrip =
    vehicle.ocsTrips.next.length === 0 ? null : vehicle.ocsTrips.next[0];
  if (nextTrip === null) {
    return null;
  }

  const estimated = estimatedArrival(vehicle.tripUpdate);
  const nextDeparture = nextTrip.scheduledDeparture;

  if (estimated === null || nextDeparture === null) {
    return null;
  }

  return minutesAfter(estimated, nextDeparture);
};

export const estimatedArrivalOfVehicle = (vehicle: Vehicle) => {
  const tripUpdate = vehicle.tripUpdate;
  const stu =
    tripUpdate?.stopTimeUpdates[tripUpdate.stopTimeUpdates.length - 1];
  return stu?.predictedArrivalTime;
};
