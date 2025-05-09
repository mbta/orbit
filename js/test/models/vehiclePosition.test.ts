import { dateTimeFromISO } from "../../dateTime";
import { Direction } from "../../models/common";
import {
  StopStatus,
  stopStatusFromData,
  vehiclePositionFromData,
} from "../../models/vehiclePosition";

describe("stopStatusFromData", () => {
  test("turns INCOMING_AT into IN_TRANSIT_TO", () => {
    expect(stopStatusFromData("INCOMING_AT")).toBe(StopStatus.InTransitTo);
  });
});

describe("vehiclePositionFromData", () => {
  test("parses a typical position from raw data", () => {
    expect(
      vehiclePositionFromData({
        route_id: "Red",
        direction: 0,
        label: "1866",
        cars: ["1866", "1867", "1877", "1876", "1839", "1838"],
        position: { latitude: 42.37469, longitude: -71.11877 },
        heading: 350,
        station_id: "place-portr",
        current_status: "INCOMING_AT",
        timestamp: "2025-04-29T20:39:49Z",
        vehicle_id: "R-5482AC4E",
      }),
    ).toEqual({
      routeId: "Red",
      directionId: Direction.Southbound,
      label: "1866",
      cars: ["1866", "1867", "1877", "1876", "1839", "1838"],
      position: { latitude: 42.37469, longitude: -71.11877 },
      heading: 350,
      stationId: "place-portr",
      stopStatus: StopStatus.InTransitTo,
      timestamp: dateTimeFromISO("2025-04-29T20:39:49Z"),
      vehicleId: "R-5482AC4E",
    });
  });

  test("parses a 4-car position from raw data", () => {
    expect(
      vehiclePositionFromData({
        route_id: "Red",
        direction: 0,
        label: "1866",
        cars: ["1866", "1867", "1877", "1876"],
        position: { latitude: 42.37469, longitude: -71.11877 },
        heading: 350,
        station_id: "Alewife-02",
        current_status: "STOPPED_AT",
        timestamp: "2025-04-29T20:39:49Z",
        vehicle_id: "R-5482AC4E",
      }),
    ).toEqual({
      routeId: "Red",
      directionId: Direction.Southbound,
      label: "1866",
      cars: ["1866", "1867", "1877", "1876"],
      position: { latitude: 42.37469, longitude: -71.11877 },
      heading: 350,
      stationId: "Alewife-02",
      stopStatus: StopStatus.StoppedAt,
      timestamp: dateTimeFromISO("2025-04-29T20:39:49Z"),
      vehicleId: "R-5482AC4E",
    });
  });
});
