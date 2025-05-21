import { height } from "../../../components/ladderPage/height";
import { StationLists } from "../../../data/stations";
import { StopStatus } from "../../../models/vehiclePosition";
import { vehiclePositionFactory } from "../../helpers/factory";

describe("height()", () => {
  describe("calculates height", () => {
    test("for a valid StoppedAt VehiclePosition", () => {
      const pos = vehiclePositionFactory.build({
        stopStatus: StopStatus.StoppedAt,
      });
      expect(height(pos, StationLists.JFKBraintree)).toBe(68);
    });

    test("for a valid InTransitTo VehiclePosition", () => {
      const pos = vehiclePositionFactory.build({
        position: { latitude: 42.298885, longitude: -71.053602 },
      });
      expect(height(pos, StationLists.JFKBraintree)).toBeCloseTo(160.42);
    });

    test("for a valid VehiclePosition past Quincy Adams", () => {
      const pos = vehiclePositionFactory.build({
        stationId: "place-brntn",
        stopId: "Braintree-01",
        stopStatus: StopStatus.StoppedAt,
      });
      expect(height(pos, StationLists.JFKBraintree)).toBe(900);
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
      expect(height(pos, StationLists.AlewifeAndrew)).toBe(20);
    });

    test("for northbound trains InTransitTo below first station", () => {
      const pos = vehiclePositionFactory.build({
        directionId: 1,
        stationId: "place-asmnl",
        stopId: "70094",
        position: { latitude: 42.283842, longitude: -71.063361 },
      });
      expect(height(pos, StationLists.JFKAshmont)).toBe(364);
    });
  });

  test("returns -1 for VehiclePosition not found on stationList", () => {
    const pos = vehiclePositionFactory.build();
    expect(height(pos, StationLists.AlewifeAndrew)).toBe(-1);
  });
});
