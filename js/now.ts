import { DateTime } from "luxon";

export const getNow = (): DateTime =>
  DateTime.fromObject({}, { zone: "America/New_York" });
