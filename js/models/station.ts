import { LatLng } from "./latlng";

export type Station = {
  id: string;
  stop_ids: string[];
  name: string;
  spacingRatio: number;
  location: LatLng;
};
