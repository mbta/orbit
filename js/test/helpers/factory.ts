import { dateTimeFromISO } from "../../dateTime";
import { Certification, CertificationData } from "../../models/certification";
import { Employee } from "../../models/employee";
import { OCSTrip } from "../../models/ocs";
import { StopTimeUpdate, TripUpdate } from "../../models/tripUpdate";
import { Vehicle } from "../../models/vehicle";
import { StopStatus, VehiclePosition } from "../../models/vehiclePosition";
import { Factory } from "fishery";
import { DateTime } from "luxon";

export const employeeFactory = Factory.define<Employee>(({ sequence }) => ({
  first_name: "Preferredy",
  last_name: "Lasty",
  badge: sequence.toString(),
}));

export const certificationDataFactory = Factory.define<CertificationData>(
  () => ({
    type: "rail",
    expires: "2023-12-12",
    rail_line: "blue",
  }),
);
export const certificationFactory = Factory.define<Certification>(() => ({
  type: "rail",
  expires: DateTime.fromISO("2023-12-12", { zone: "America/New_York" }),
  railLine: "blue",
}));

export const vehiclePositionFactory = Factory.define<VehiclePosition>(() => ({
  cars: ["1877", "1876", "1807", "1806", "1815", "1814"],
  directionId: 1,
  heading: 330,
  label: "1877",
  position: { latitude: 42.2773, longitude: -71.03159 },
  routeId: "Red",
  stationId: "place-jfk",
  stopId: "70096",
  stopStatus: StopStatus.InTransitTo,
  timestamp: dateTimeFromISO("2025-04-29T21:27:26.679Z"),
  vehicleId: "R-5482CAAA",
  tripId: "68077971",
}));

export const stopTimeUpdateFactory = Factory.define<StopTimeUpdate>(() => ({
  predictedArrivalTime: dateTimeFromISO("2025-04-29T21:51:38Z"),
  predictedDepartureTime: dateTimeFromISO("2025-04-29T21:53:38Z"),
  stationId: "place-brdwy",
}));

export const tripUpdateFactory = Factory.define<TripUpdate>(() => ({
  direction: 0,
  label: "1877",
  routeId: "Red",
  routePatternId: "Red-1-0",
  timestamp: dateTimeFromISO("2025-04-29T21:27:26.679Z"),
  tripId: "68078228",
  vehicleId: "R-54831F04",
  stopTimeUpdates: [stopTimeUpdateFactory.build()],
}));

export const ocsTripFactory = Factory.define<OCSTrip>(() => ({
  scheduledDeparture: dateTimeFromISO("2025-04-29T21:41:00.000Z"),
  scheduledArrival: dateTimeFromISO("2025-04-29T22:24:00.000Z"),
  actualDeparture: dateTimeFromISO("2025-04-29T21:43:00.000Z"),
  originStation: "ASHMONT",
  destinationStation: "ALEWIFE",
  offset: 0,
  deleted: false,
  updatedAt: dateTimeFromISO("2025-04-29T06:00:00.000Z"),
}));

export const vehicleFactory = Factory.define<Vehicle>(() => ({
  vehiclePosition: vehiclePositionFactory.build(),
  tripUpdate: tripUpdateFactory.build(),
  ocsTrips: {
    current: ocsTripFactory.build(),
    next: [],
  },
}));
