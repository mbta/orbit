import { getMetaContent } from "./metadata";
import { z } from "zod";

export const isFeatureEnabled = (featureName: string): boolean => {
  const laboratoryFeaturesJSON = getMetaContent("laboratoryFeatures");
  if (laboratoryFeaturesJSON === null) {
    return false;
  }

  const laboratoryFeaturesData = JSON.parse(laboratoryFeaturesJSON) as Record<
    string,
    boolean
  >;
  const laboratoryFeatures = z
    .record(z.string(), z.boolean())
    .parse(laboratoryFeaturesData);
  if (laboratoryFeatures[featureName]) {
    return true;
  }
  return false;
};
