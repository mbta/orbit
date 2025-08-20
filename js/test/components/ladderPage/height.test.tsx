import {
  height,
  vehicleHeightDiff,
} from "../../../components/ladderPage/height";
import { VehicleWithHeight } from "../../../components/ladderPage/ladder";
import { Stations } from "../../../data/stations";
import { StopStatus } from "../../../models/vehiclePosition";
import { vehiclePositionFactory } from "../../helpers/factory";

describe("height()", () => {
  describe("calculates height", () => {
    test("for a valid StoppedAt VehiclePosition", () => {
      const pos = vehiclePositionFactory.build({
        stopStatus: StopStatus.StoppedAt,
      });
      expect(height(pos, Stations.Red[2])).toBe(68);
    });

    test("for a valid southbound InTransitTo VehiclePosition", () => {
      const pos = vehiclePositionFactory.build({
        directionId: 0,
        stationId: "place-davis",
        stopId: "70063",
        position: { latitude: 42.397631, longitude: -71.130443 },
      });
      expect(height(pos, Stations.Red[0])).toBeCloseTo(144.16);
    });

    test("for a valid northbound InTransitTo VehiclePosition", () => {
      const pos = vehiclePositionFactory.build({
        position: { latitude: 42.298885, longitude: -71.053602 },
      });
      expect(height(pos, Stations.Red[2])).toBeCloseTo(160.42);
    });

    test("for a valid VehiclePosition past Quincy Adams", () => {
      const pos = vehiclePositionFactory.build({
        stationId: "place-brntn",
        stopId: "Braintree-01",
        stopStatus: StopStatus.StoppedAt,
      });
      expect(height(pos, Stations.Red[2])).toBe(900);
    });

    // TODO: handling trains "above" or "below" the ladder will change once we have
    // interpolation between Andrew <-> JFK
    test("for southbound trains InTransitTo above first station", () => {
      const pos = vehiclePositionFactory.build({
        directionId: 0,
        stationId: "place-alfcl",
        stopId: "Alewife-02",
        position: { latitude: 42.396177, longitude: -71.142923 },
      });
      expect(height(pos, Stations.Red[0])).toBe(20);
    });

    test("for northbound trains InTransitTo below first station", () => {
      const pos = vehiclePositionFactory.build({
        directionId: 1,
        stationId: "place-asmnl",
        stopId: "70094",
        position: { latitude: 42.283842, longitude: -71.063361 },
      });
      expect(height(pos, Stations.Red[1])).toBe(364);
    });
  });

  test("returns -1 for VehiclePosition not found on stationList", () => {
    const pos = vehiclePositionFactory.build();
    expect(height(pos, Stations.Red[0])).toBe(-1);
  });
});

describe("vehicleHeightDiff()", () => {
  describe("northbound", () => {
    test("calculates height diff for valid vehicles", () => {
      const aboveNorthbound: VehicleWithHeight = {
        vehicle: {
          vehiclePosition: vehiclePositionFactory.build({
            stationId: "place-alfcl",
            stopId: "Alewife-01",
            stopStatus: StopStatus.StoppedAt,
          }),
          ocsTrips: { current: null, next: [] },
        },
        heights: { dotHeight: 80, labelOffset: null },
      };

      const belowNorthbound: VehicleWithHeight = {
        vehicle: {
          vehiclePosition: vehiclePositionFactory.build({
            stationId: "place-alfcl",
            stopId: "Alewife-01",
            stopStatus: StopStatus.InTransitTo,
            position: { latitude: 42.396245, longitude: -71.14036 },
          }),
          ocsTrips: { current: null, next: [] },
        },
        heights: { dotHeight: 95, labelOffset: null },
      };
      expect(vehicleHeightDiff(aboveNorthbound, belowNorthbound, 1)).toBe(15);
    });
  });

  describe("southbound", () => {
    test("calculates height diff for valid vehicles", () => {
      const aboveSouthbound: VehicleWithHeight = {
        vehicle: {
          vehiclePosition: vehiclePositionFactory.build({
            directionId: 0,
            stationId: "place-davis",
            stopId: "70063",
            stopStatus: StopStatus.InTransitTo,
            position: { latitude: 42.397317, longitude: -71.123838 },
          }),
          ocsTrips: { current: null, next: [] },
        },
        heights: { dotHeight: 180, labelOffset: null },
      };

      const belowSouthbound: VehicleWithHeight = {
        vehicle: {
          vehiclePosition: vehiclePositionFactory.build({
            directionId: 0,
            stationId: "place-davis",
            stopId: "70063",
            stopStatus: StopStatus.StoppedAt,
          }),
          ocsTrips: { current: null, next: [] },
        },
        heights: { dotHeight: 200, labelOffset: null },
      };
      expect(vehicleHeightDiff(aboveSouthbound, belowSouthbound, 1)).toBe(20);
    });
  });
});
