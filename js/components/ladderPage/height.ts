import { proportionBetweenLatLngs } from "../../models/latlng";
import { Station } from "../../models/station";
import { StopStatus, VehiclePosition } from "../../models/vehiclePosition";

export const height = (pos: VehiclePosition, stationSet: Station[]) => {
  const index = stationSet.findIndex((station) => pos.stationId === station.id);
  let height = 0;
  // eslint-disable-next-line better-mutation/no-mutation
  for (let i = 0; i <= index; i++) {
    height += stationSet[i].spacingRatio * 32 + 24;
  }

  if (
    pos.stopStatus === StopStatus.InTransitTo &&
    pos.position !== null &&
    index !== -1
  ) {
    height -=
      1 -
      proportionBetweenLatLngs(
        stationSet[index - 1].location,
        stationSet[index].location,
        pos.position,
      ) *
        stationSet[index - 1].spacingRatio *
        32;
  }

  return height;
};
