import { proportionBetweenLatLngs } from "../../models/latlng";
import { Station } from "../../models/station";
import { StopStatus, VehiclePosition } from "../../models/vehiclePosition";

// TODO: get both directions working, then cleanup/DRY
export const height = (pos: VehiclePosition, stationSet: Station[]) => {
  if (pos.directionId === 0) {
    // southbound

    const index = stationSet.findIndex(
      (station) => pos.stationId === station.id,
    );

    let height = 68;
    if (index === 0) {
      if (pos.stopStatus === StopStatus.StoppedAt) {
        return height;
      } else {
        // handle case where trains InTransitTo are above the stationSet bounds
        return 20;
      }
    }

    for (let i = 0; i < index; i += 1) {
      // spacingRatio * 32 = actual px value of bottom margin
      // 24 = height of the station name
      height += stationSet[i].spacingRatio * 32 + 24;
    }

    if (
      pos.stopStatus === StopStatus.InTransitTo &&
      pos.position !== null &&
      index !== -1
    ) {
      height -=
        (1 -
          proportionBetweenLatLngs(
            stationSet[index - 1].location,
            stationSet[index].location,
            pos.position,
          )) *
        (stationSet[index - 1].spacingRatio * 32);
    }

    return height;
  } else {
    // northbound

    const index = stationSet.findIndex(
      (station) => pos.stationId === station.id,
    );

    let height = 68;

    for (let i = 0; i <= index; i += 1) {
      height += stationSet[i].spacingRatio * 32 + 24;
    }

    if (pos.stopStatus === StopStatus.StoppedAt) {
      if (index === stationSet.length - 1) {
        return height;
      } else {
        return height - (stationSet[index].spacingRatio * 32 + 24);
      }
    } else {
      //handle case where trains InTransitTo are below stationSet bounds
      if (index === stationSet.length - 1) {
        return height + 40;
      }

      if (pos.position !== null && index !== -1) {
        height -=
          proportionBetweenLatLngs(
            stationSet[index + 1].location,
            stationSet[index].location,
            pos.position,
          ) *
          (stationSet[index].spacingRatio * 32);
      }

      return height;
    }
  }
};
