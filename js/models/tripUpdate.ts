import { ocsStationNameToGtfs } from "../data/stations";
import { dateTimeFromUnix } from "../dateTime";
import { RouteId } from "./common";
import { DateTime } from "luxon";
import { z } from "zod";

export const StopTimeUpdateData = z.object({
  station_id: z.string(),
  predicted_arrival_time: z.number().nullable(),
  predicted_departure_time: z.number().nullable(),
});
export type StopTimeUpdateData = z.infer<typeof StopTimeUpdateData>;

export type TripUpdate = {
  label: string | null;
  routeId: RouteId;
  direction: number | null;
  routePatternId: string | null;
  tripId: string;
  vehicleId: string | null;
  timestamp: DateTime | null;
  stopTimeUpdates: StopTimeUpdate[];
};

export type StopTimeUpdate = {
  stationId: string;
  predictedArrivalTime: DateTime | null;
  predictedDepartureTime: DateTime | null;
};

export const stopTimeUpdateFromData = (
  data: StopTimeUpdateData,
): StopTimeUpdate => ({
  stationId: data.station_id,
  predictedArrivalTime:
    data.predicted_arrival_time !== null ?
      dateTimeFromUnix(data.predicted_arrival_time)
    : null,
  predictedDepartureTime:
    data.predicted_departure_time !== null ?
      dateTimeFromUnix(data.predicted_departure_time)
    : null,
});

export const tripUpdateFromData = (data: TripUpdateData): TripUpdate => ({
  routeId: data.route_id,
  label: data.label ?? null,
  direction: data.direction,
  routePatternId: data.route_pattern_id ?? null,
  tripId: data.trip_id,
  vehicleId: data.vehicle_id,
  timestamp: data.timestamp ? dateTimeFromUnix(data.timestamp) : null,
  stopTimeUpdates: data.stop_time_updates.map(stopTimeUpdateFromData),
});

export const TripUpdateData = z.object({
  label: z.string().nullable(),
  route_id: z.string(),
  direction: z.number().nullable(),
  route_pattern_id: z.string().nullable(),
  trip_id: z.string(),
  vehicle_id: z.string().nullable(),
  timestamp: z.number().nullable(),
  stop_time_updates: z.array(StopTimeUpdateData),
});
export type TripUpdateData = z.infer<typeof TripUpdateData>;

export const predictedArrivalTimeForOcsStationId = (
  stopTimeUpdates: StopTimeUpdate[] | null | undefined, 
  ocsStationId: string | null | undefined,
) => {
  if (!ocsStationId) return null;

  return stopTimeUpdates?.find(stopTimeUpdate => {
    stopTimeUpdate.stationId === ocsStationNameToGtfs(ocsStationId)
  })?.predictedArrivalTime ?? null;
};

const stopTimeUpdateForLastStation = (stopTimeUpdates: StopTimeUpdate[] | null | undefined): StopTimeUpdate | null => {
  if (!stopTimeUpdates || stopTimeUpdates.length == 0) return null;

  return stopTimeUpdates[stopTimeUpdates.length - 1];
}

export const estimatedArrival = (tu?: TripUpdate): DateTime | null => {
  return stopTimeUpdateForLastStation(tu?.stopTimeUpdates)?.predictedArrivalTime ?? null;
};

export const lastArrivalStationId = (tu?: TripUpdate): string | null => {
  return stopTimeUpdateForLastStation(tu?.stopTimeUpdates)?.stationId ?? null;
};
