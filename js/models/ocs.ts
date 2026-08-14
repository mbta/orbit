import { dateTimeFromISO } from "../dateTime";
import { DateTime } from "luxon";
import z from "zod";

export const OCSTripData = z.object({
  uid: z.string(),
  next_uid: z.string().nullable(),
  departed: z.boolean().nullable(),
  actual_departure: z.string().nullable(),
  scheduled_departure: z.string().nullable(),
  scheduled_arrival: z.string().nullable(),
  offset: z.number().nullable(),
  origin_station: z.string().nullable(),
  destination_station: z.string().nullable(),
  origin_station_updated: z.string().nullable(),
  destination_station_updated: z.string().nullable(),
  deleted: z.boolean().nullable(),
  updated_at: z.string(),
});
export type OCSTripData = z.infer<typeof OCSTripData>;

export type OCSTrip = {
  uid: string;
  nextUid: string | null;
  departed: boolean | null;
  actualDeparture: DateTime | null;
  scheduledDeparture: DateTime | null;
  scheduledArrival: DateTime | null;
  offset: number | null;
  originStation: string | null;
  destinationStation: string | null;
  originStationUpdated: string | null;
  destinationStationUpdated: string | null;
  deleted: boolean | null;
  updatedAt: DateTime;
};

export const ocsTripFromData = (data: OCSTripData): OCSTrip => ({
  uid: data.uid,
  nextUid: data.next_uid,
  departed: data.departed,
  actualDeparture:
    data.actual_departure ? dateTimeFromISO(data.actual_departure) : null,
  scheduledDeparture:
    data.scheduled_departure ? dateTimeFromISO(data.scheduled_departure) : null,
  scheduledArrival:
    data.scheduled_arrival ? dateTimeFromISO(data.scheduled_arrival) : null,
  offset: data.offset,
  originStation: data.origin_station,
  destinationStation: data.destination_station,
  originStationUpdated: data.origin_station_updated ?? null,
  destinationStationUpdated: data.destination_station_updated ?? null,
  deleted: data.deleted,
  updatedAt: dateTimeFromISO(data.updated_at),
});
