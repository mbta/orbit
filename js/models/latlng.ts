import { z } from "zod";

export type LatLng = {
  latitude: number;
  longitude: number;
};

export const LatLng = z.object({
  latitude: z.number(),
  longitude: z.number(),
}) satisfies z.ZodType<LatLng>;
