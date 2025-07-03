import { dateTimeFromISO } from "../dateTime";
import { DateTime } from "luxon";
import z from "zod";

export const OCSTripData = z.object({
  scheduled_departure: z.string(),
  scheduled_arrival: z.string(),
  offset: z.number().nullable(),
  origin_station: z.string().nullable(),
  destination_station: z.string().nullable(),
  deleted: z.boolean().nullable(),
});
export type OCSTripData = z.infer<typeof OCSTripData>;

export type OCSTrip = {
  scheduledDeparture: DateTime | null;
  scheduledArrival: DateTime | null;
  offset: number | null;
  originStation: string | null;
  destinationStation: string | null;
  deleted: boolean | null;
};

export const ocsTripFromData = (data: OCSTripData): OCSTrip => ({
  scheduledDeparture: dateTimeFromISO(data.scheduled_departure),
  scheduledArrival: dateTimeFromISO(data.scheduled_arrival),
  offset: data.offset,
  originStation: data.origin_station,
  destinationStation: data.destination_station,
  deleted: data.deleted,
});
