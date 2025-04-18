import { dateTimeFromUnix } from "../dateTime";
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

const stopStatusFromData = (data: StopStatusData): StopStatus => {
  switch (data) {
    case "INCOMING_AT":
    case "IN_TRANSIT_TO":
      return StopStatus.InTransitTo;
    case "STOPPED_AT":
      return StopStatus.StoppedAt;
  }
};

export type VehiclePositionData = {
  route_id: string;
  direction: number;
  label: string;
  cars: string[];
  position: { latitude: number; longitude: number } | null;
  heading: number | null;
  station_id: string | null;
  current_status: StopStatusData;
  timestamp: number | null;
  vehicle_id: string | null;
  // trip: TripEndData | null;
};

export type VehiclePosition = {
  routeId: RouteId;
  directionId: DirectionId;
  label: CarId;
  cars: CarId[];
  position: LatLng | null;
  stationId: StationId | null;
  stopStatus: StopStatus;
  heading: number | null;
  timestamp: DateTime | null;
  vehicleId: string | null;
  // trip: TripEnd | null;
};

export const vehiclePositionFromData = (
  data: VehiclePositionData,
): VehiclePosition => ({
  routeId: data.route_id,
  directionId: data.direction,
  label: data.label,
  cars: data.cars,
  stationId: data.station_id,
  stopStatus: stopStatusFromData(data.current_status),
  position: data.position,
  heading: data.heading,
  timestamp: data.timestamp !== null ? dateTimeFromUnix(data.timestamp) : null,
  vehicleId: data.vehicle_id,
  // trip: data.trip !== null ? tripEndFromData(data.trip) : null,
});
