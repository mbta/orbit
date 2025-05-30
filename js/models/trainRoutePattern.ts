// Represents a hard-coded list of understood route patterns
export type TrainRoutePattern = "Red-Ashmont" | "Red-Braintree";

// We assume that the set of route patterns we care about can be mapped from
// a known set of IDs.
const patternIdsToNames: Record<string, TrainRoutePattern | undefined> = {
  "Red-1-0": "Red-Ashmont",
  "Red-1-1": "Red-Ashmont",
  "Red-3-0": "Red-Braintree",
  "Red-3-1": "Red-Braintree",
};

export const trainRoutePatternFromId = (
  routePatternId: string,
): TrainRoutePattern | undefined => {
  return patternIdsToNames[routePatternId];
};
