import { z } from "zod";

export type TripDescriptor = {
  tripId?: string | null;
  // Note: The spec includes additional fields that can be used to identify a trip
  // but for now we will only concern ourselves with trip ID
};

export const TripDescriptor = z.object({
  tripId: z.string().nullable().optional(),
}) satisfies z.ZodType<TripDescriptor>;

export const TripDescriptorData = z.object({
  trip_id: z.string().nullable().optional(),
});
export type TripDescriptorData = z.infer<typeof TripDescriptorData>;

export const tripDescriptorFromData = (
  data: TripDescriptorData,
): TripDescriptor => ({
  tripId: data.trip_id,
});
