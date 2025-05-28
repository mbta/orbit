import { z } from "zod";

export type LatLng = {
  latitude: number;
  longitude: number;
};

export const LatLng = z.object({
  latitude: z.number(),
  longitude: z.number(),
}) satisfies z.ZodType<LatLng>;

/**
 * Find how far between a start an finish and intermediate point is,
 * by projecting it onto the vector between the start and finish.
 *
 * @param start A coordinate pair
 * @param finish Another coordinate pair
 * @param point A target pair
 * @returns How far between start and finish `point` is, between 0 and 1.
 */
export const proportionBetweenLatLngs = (
  start: LatLng,
  finish: LatLng,
  point: LatLng,
): number | null => {
  const totalLatDelta: number = finish.latitude - start.latitude;
  const totalLngDelta: number = finish.longitude - start.longitude;
  const pointLatDelta: number = point.latitude - start.latitude;
  const pointLngDelta: number = point.longitude - start.longitude;
  const dotProductStartToPoint: number =
    totalLatDelta * pointLatDelta + totalLngDelta * pointLngDelta;
  const startToFinishMagnitudeSquared: number =
    totalLatDelta * totalLatDelta + totalLngDelta * totalLngDelta;
  return startToFinishMagnitudeSquared === 0.0 ? null : (
      dotProductStartToPoint / startToFinishMagnitudeSquared
    );
};
