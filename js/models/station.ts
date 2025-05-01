import { LatLng } from "./latlng";

export type Station = {
  id: string;
  name: string;
  spacingRatio: number;
  location: LatLng;
};
