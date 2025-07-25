import { trackSideBarOpened } from "../../telemetry/trackingEvents";
import {
  ocsTripFactory,
  tripUpdateFactory,
  vehicleFactory,
} from "../helpers/factory";
import { FullStory } from "@fullstory/browser";

jest.mock("@fullstory/browser", () => ({
  FullStory: jest.fn(),
}));

describe("trackSideBarOpened", () => {
  const expectedEventName = "Preston test event";

  test("track FS event with correct name", () => {
    trackSideBarOpened({
      vehicle: vehicleFactory.build(),
    });

    expect(FullStory).toHaveBeenCalledWith("trackEvent", {
      name: expectedEventName,
      properties: {
        train_uid: "R-5482CAAA",
        missing_data: [],
      },
    });
  });

  describe("missing trip properties", () => {
    test("report when current trip is missing", () => {
      const vehicle = vehicleFactory.build({
        ocsTrips: {
          current: null,
          next: [],
        },
      });

      trackSideBarOpened({ vehicle });

      expect(FullStory).toHaveBeenCalledWith("trackEvent", {
        name: expectedEventName,
        properties: {
          train_uid: "R-5482CAAA",
          missing_data: [
            "current_destination_station",
            "current_origin_station",
            "current_scheduled_arrival",
            "current_scheduled_departure",
            "current_trip",
          ],
        },
      });
    });

    test("report when current trip has missing properties", () => {
      const vehicle = vehicleFactory.build({
        ocsTrips: {
          current: ocsTripFactory.build({
            scheduledArrival: null,
            scheduledDeparture: null,
            destinationStation: null,
            originStation: null,
          }),
          next: [],
        },
      });

      trackSideBarOpened({ vehicle });

      expect(FullStory).toHaveBeenCalledWith("trackEvent", {
        name: expectedEventName,
        properties: {
          train_uid: "R-5482CAAA",
          missing_data: [
            "current_destination_station",
            "current_origin_station",
            "current_scheduled_arrival",
            "current_scheduled_departure",
          ],
        },
      });
    });

    test("report when estimated arrival is missing", () => {
      const vehicle = vehicleFactory.build({
        tripUpdate: tripUpdateFactory.build({
          stopTimeUpdates: [],
        }),
      });

      trackSideBarOpened({ vehicle });

      expect(FullStory).toHaveBeenCalledWith("trackEvent", {
        name: expectedEventName,
        properties: {
          train_uid: "R-5482CAAA",
          missing_data: ["current_estimated_arrival"],
        },
      });
    });

    test("report when next trip is missing", () => {
      const vehicle = vehicleFactory.build({
        ocsTrips: {
          current: ocsTripFactory.build({
            nextUid: "22222222",
          }),
          next: [],
        },
      });

      trackSideBarOpened({ vehicle });

      expect(FullStory).toHaveBeenCalledWith("trackEvent", {
        name: expectedEventName,
        properties: {
          train_uid: "R-5482CAAA",
          missing_data: [
            "next_destination_station",
            "next_origin_station",
            "next_scheduled_arrival",
            "next_scheduled_departure",
            "next_trip",
          ],
        },
      });
    });

    test("report when next trip has missing properties", () => {
      const vehicle = vehicleFactory.build({
        ocsTrips: {
          current: ocsTripFactory.build({
            nextUid: "22222222",
          }),
          next: [
            ocsTripFactory.build({
              scheduledArrival: null,
              scheduledDeparture: null,
              destinationStation: null,
              originStation: null,
            }),
          ],
        },
      });

      trackSideBarOpened({ vehicle });

      expect(FullStory).toHaveBeenCalledWith("trackEvent", {
        name: expectedEventName,
        properties: {
          train_uid: "R-5482CAAA",
          missing_data: [
            "next_destination_station",
            "next_origin_station",
            "next_scheduled_arrival",
            "next_scheduled_departure",
          ],
        },
      });
    });
  });
});
