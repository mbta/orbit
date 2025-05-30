import { vehiclesFromPositionsAndTripUpdates } from "../../models/vehicle";
import { tripUpdateFactory, vehiclePositionFactory } from "../helpers/factory";

describe("vehiclesFromPositionsAndTripUpdates", () => {
  test("matches vehicle positions and trip updates", () => {
    const vehiclePositions = [
      vehiclePositionFactory.build({
        label: "1888",
        trip: { tripId: "11111" },
      }),
      vehiclePositionFactory.build({
        label: "1889",
        trip: { tripId: "22222" },
      }),
      vehiclePositionFactory.build({
        label: "1890",
        trip: { tripId: "33333" },
      }),
      vehiclePositionFactory.build({
        label: "1891",
        trip: null,
      }),
    ];

    const tripUpdates = [
      tripUpdateFactory.build({
        tripId: "11111",
      }),
      tripUpdateFactory.build({
        tripId: "22222",
      }),
    ];

    const vehicles = vehiclesFromPositionsAndTripUpdates(
      vehiclePositions,
      tripUpdates,
    );
    const v1888 = vehicles.find(
      (vehicle) => vehicle.vehiclePosition.label === "1888",
    );
    const v1889 = vehicles.find(
      (vehicle) => vehicle.vehiclePosition.label === "1889",
    );
    const v1890 = vehicles.find(
      (vehicle) => vehicle.vehiclePosition.label === "1890",
    );
    const v1891 = vehicles.find(
      (vehicle) => vehicle.vehiclePosition.label === "1891",
    );

    expect(v1888?.tripUpdate?.tripId).toBe("11111");
    expect(v1889?.tripUpdate?.tripId).toBe("22222");
    expect(v1890).toBeDefined();
    expect(v1890?.tripUpdate).toBeUndefined();
    expect(v1891).toBeDefined();
    expect(v1891?.tripUpdate).toBeUndefined();
  });
});
