import { dateTimeFromISO } from "../../dateTime";
import { ocsTripFromData } from "../../models/ocs";

describe("ocsTripFromData", () => {
  test("parses an OCS trip from raw data", () => {
    expect(
      ocsTripFromData({
        scheduled_departure: "2025-04-29T21:41:00.000Z",
        actual_departure: "2025-04-29T21:43:00.000Z",
        scheduled_arrival: "2025-04-29T22:24:00.000Z",
        origin_station: "place-asmnl",
        destination_station: "place-alfcl",
        offset: 0,
        deleted: false,
      }),
    ).toEqual({
      scheduledDeparture: dateTimeFromISO("2025-04-29T21:41:00.000Z"),
      actualDeparture: dateTimeFromISO("2025-04-29T21:43:00.000Z"),
      scheduledArrival: dateTimeFromISO("2025-04-29T22:24:00.000Z"),
      originStation: "place-asmnl",
      destinationStation: "place-alfcl",
      offset: 0,
      deleted: false,
    });
  });
});
