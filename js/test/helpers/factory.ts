import { dateTimeFromISO } from "../../dateTime";
import { Certification, CertificationData } from "../../models/certification";
import { Employee } from "../../models/employee";
import { StopTimeUpdate, TripUpdate } from "../../models/tripUpdate";
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
  stationId: "70096",
  stopStatus: StopStatus.InTransitTo,
  timestamp: dateTimeFromISO("2025-04-29T21:27:26.679Z"),
  vehicleId: "R-5482CAAA",
}));

export const stopTimeUpdateFactory = Factory.define<StopTimeUpdate>(() => ({
  predictedArrivalTime: DateTime.fromISO("2025-05-15T21:51:38.626Z"),
  predictedDepartureTime: DateTime.fromISO("2025-05-15T21:53:38.626Z"),
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
