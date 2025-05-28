import { LatLng } from "./latlng";

export type Station = {
  id: string;
  stop_ids: string[];
  name: string;
  spacingRatio: number;
  location: LatLng;
  // track-level stopIds which are specfic to one side of the station
  forcedDirections?: Map<string, number>;
};
