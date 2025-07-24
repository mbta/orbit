import { dateTimeFromISO } from "../../dateTime";
import { vehicleFromVehicleData } from "../../models/vehicle";

describe("vehicleFromVehicleData", () => {
  test("parses a VehicleData into a Vehicle", () => {
    expect(
      vehicleFromVehicleData({
        ocs_trips: {
          current: {
            origin_station: "place-asmnl",
            destination_station: "place-alfcl",
            offset: 0,
            scheduled_departure: "2025-04-29T19:39:49Z",
            actual_departure: "2025-04-29T19:40:49Z",
            scheduled_arrival: "2025-04-29T20:39:49Z",
            deleted: false,
          },
          next: [],
        },
        position: {
          route_id: "Red",
          direction: 0,
          label: "1866",
          cars: ["1866", "1867", "1877", "1876"],
          position: { latitude: 42.37469, longitude: -71.11877 },
          heading: 350,
          station_id: "place-alfcl",
          stop_id: "Alewife-02",
          current_status: "STOPPED_AT",
          timestamp: "2025-04-29T20:39:49Z",
          vehicle_id: "R-5482AC4E",
          trip_id: "68077971",
        },
        trip_update: {
          direction: 0,
          label: "1877",
          route_id: "Red",
          route_pattern_id: "Red-1-0",
          timestamp: 1751312060,
          trip_id: "68078228",
          vehicle_id: "R-54831F04",
          stop_time_updates: [],
        },
      }),
    ).toEqual({
      tripUpdate: {
        direction: 0,
        label: "1877",
        routeId: "Red",
        routePatternId: "Red-1-0",
        stopTimeUpdates: [],
        timestamp: dateTimeFromISO("2025-06-30T15:34:20.000-04:00"),
        tripId: "68078228",
        vehicleId: "R-54831F04",
      },
      vehiclePosition: {
        cars: ["1866", "1867", "1877", "1876"],
        directionId: 0,
        heading: 350,
        label: "1866",
        position: { latitude: 42.37469, longitude: -71.11877 },
        routeId: "Red",
        stationId: "place-alfcl",
        stopId: "Alewife-02",
        stopStatus: 1,
        timestamp: dateTimeFromISO("2025-04-29T16:39:49.000-04:00"),
        tripId: "68077971",
        vehicleId: "R-5482AC4E",
      },
      ocsTrips: {
        current: {
          originStation: "place-asmnl",
          destinationStation: "place-alfcl",
          offset: 0,
          scheduledDeparture: dateTimeFromISO("2025-04-29T19:39:49Z"),
          actualDeparture: dateTimeFromISO("2025-04-29T19:40:49Z"),
          scheduledArrival: dateTimeFromISO("2025-04-29T20:39:49Z"),
          deleted: false,
        },
        next: [],
      },
    });
  });

  test("null trip_update becomes undefined", () => {
    expect(
      vehicleFromVehicleData({
        ocs_trips: {
          current: {
            origin_station: "place-asmnl",
            destination_station: "place-alfcl",
            offset: 0,
            scheduled_departure: "2025-04-29T19:39:49Z",
            actual_departure: "2025-04-29T19:40:49Z",
            scheduled_arrival: "2025-04-29T20:39:49Z",
            deleted: false,
          },
          next: [],
        },
        position: {
          route_id: "Red",
          direction: 0,
          label: "1866",
          cars: ["1866", "1867", "1877", "1876"],
          position: { latitude: 42.37469, longitude: -71.11877 },
          heading: 350,
          station_id: "place-alfcl",
          stop_id: "Alewife-02",
          current_status: "STOPPED_AT",
          timestamp: "2025-04-29T20:39:49Z",
          vehicle_id: "R-5482AC4E",
          trip_id: "68077971",
        },
        trip_update: null,
      }),
    ).toEqual({
      ocsTrips: {
        current: {
          originStation: "place-asmnl",
          destinationStation: "place-alfcl",
          offset: 0,
          scheduledDeparture: dateTimeFromISO("2025-04-29T19:39:49Z"),
          actualDeparture: dateTimeFromISO("2025-04-29T19:40:49Z"),
          scheduledArrival: dateTimeFromISO("2025-04-29T20:39:49Z"),
          deleted: false,
        },
        next: [],
      },
      vehiclePosition: {
        cars: ["1866", "1867", "1877", "1876"],
        directionId: 0,
        heading: 350,
        label: "1866",
        position: { latitude: 42.37469, longitude: -71.11877 },
        routeId: "Red",
        stationId: "place-alfcl",
        stopId: "Alewife-02",
        stopStatus: 1,
        timestamp: dateTimeFromISO("2025-04-29T16:39:49.000-04:00"),
        tripId: "68077971",
        vehicleId: "R-5482AC4E",
      },
    });
  });
});
