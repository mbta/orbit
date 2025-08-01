import { dateTimeFromISO } from "../../dateTime";
import { ocsTripFromData } from "../../models/ocs";

describe("ocsTripFromData", () => {
  test("parses an OCS trip from raw data", () => {
    expect(
      ocsTripFromData({
        uid: "11111111",
        next_uid: null,
        scheduled_departure: "2025-04-29T21:41:00.000Z",
        departed: true,
        actual_departure: "2025-04-29T21:43:00.000Z",
        scheduled_arrival: "2025-04-29T22:24:00.000Z",
        origin_station: "place-asmnl",
        destination_station: "place-alfcl",
        offset: 0,
        deleted: false,
        updated_at: "2025-04-29T21:44:00.000Z",
      }),
    ).toEqual({
      uid: "11111111",
      nextUid: null,
      scheduledDeparture: dateTimeFromISO("2025-04-29T21:41:00.000Z"),
      departed: true,
      actualDeparture: dateTimeFromISO("2025-04-29T21:43:00.000Z"),
      scheduledArrival: dateTimeFromISO("2025-04-29T22:24:00.000Z"),
      originStation: "place-asmnl",
      destinationStation: "place-alfcl",
      offset: 0,
      deleted: false,
      updatedAt: dateTimeFromISO("2025-04-29T21:44:00.000Z"),
    });
  });
});
