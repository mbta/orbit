import { dateTimeFromISO } from "../dateTime";
import { DateTime } from "luxon";
import z from "zod";

export const OCSTripData = z.object({
  actual_departure: z.string().nullable(),
  scheduled_departure: z.string().nullable(),
  scheduled_arrival: z.string().nullable(),
  offset: z.number().nullable(),
  origin_station: z.string().nullable(),
  destination_station: z.string().nullable(),
  deleted: z.boolean().nullable(),
});
export type OCSTripData = z.infer<typeof OCSTripData>;

export type OCSTrip = {
  actualDeparture: DateTime | null;
  scheduledDeparture: DateTime | null;
  scheduledArrival: DateTime | null;
  offset: number | null;
  originStation: string | null;
  destinationStation: string | null;
  deleted: boolean | null;
};

export const ocsTripFromData = (data: OCSTripData): OCSTrip => ({
  actualDeparture:
    data.actual_departure ? dateTimeFromISO(data.actual_departure) : null,
  scheduledDeparture:
    data.scheduled_departure ? dateTimeFromISO(data.scheduled_departure) : null,
  scheduledArrival:
    data.scheduled_arrival ? dateTimeFromISO(data.scheduled_arrival) : null,
  offset: data.offset,
  originStation: data.origin_station,
  destinationStation: data.destination_station,
  deleted: data.deleted,
});
