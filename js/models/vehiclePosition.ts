import { dateTimeFromISO } from "../dateTime";
import { CarId, DirectionId, RouteId, StationId } from "./common";
import { LatLng } from "./latlng";
import { DateTime } from "luxon";
import { z } from "zod";

export enum StopStatus {
  InTransitTo,
  StoppedAt,
}

const StopStatusData = z.enum(["INCOMING_AT", "STOPPED_AT", "IN_TRANSIT_TO"]);
type StopStatusData = z.infer<typeof StopStatusData>;

export const stopStatusFromData = (data: StopStatusData): StopStatus => {
  switch (data) {
    case "INCOMING_AT":
    case "IN_TRANSIT_TO":
      return StopStatus.InTransitTo;
    case "STOPPED_AT":
      return StopStatus.StoppedAt;
  }
};

export const VehiclePositionData = z.object({
  route_id: z.string(),
  revenue: z.boolean(),
  direction: z.number(),
  label: z.string(),
  cars: z.array(z.string()),
  position: z
    .object({ latitude: z.number(), longitude: z.number() })
    .nullable(),
  heading: z.number().nullable(),
  station_id: z.string().nullable(),
  stop_id: z.string().nullable(),
  current_status: StopStatusData,
  timestamp: z.string().nullable(),
  vehicle_id: z.string().nullable(),
  trip_id: z.string().nullable(),
});
export type VehiclePositionData = z.infer<typeof VehiclePositionData>;

export type VehiclePosition = {
  routeId: RouteId;
  revenue: boolean;
  directionId: DirectionId;
  label: CarId;
  cars: CarId[];
  position: LatLng | null;
  stationId: StationId | null;
  stopId: string | null;
  stopStatus: StopStatus;
  heading: number | null;
  timestamp: DateTime | null;
  vehicleId: string | null;
  tripId: string | null;
};

export const vehiclePositionFromData = (
  data: VehiclePositionData,
): VehiclePosition => ({
  routeId: data.route_id,
  revenue: data.revenue,
  directionId: data.direction,
  label: data.label,
  cars: data.cars,
  stationId: data.station_id,
  stopId: data.stop_id,
  stopStatus: stopStatusFromData(data.current_status),
  position: data.position,
  heading: data.heading,
  timestamp: data.timestamp !== null ? dateTimeFromISO(data.timestamp) : null,
  vehicleId: data.vehicle_id,
  tripId: data.trip_id,
});
