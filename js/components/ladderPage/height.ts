import { proportionBetweenLatLngs } from "../../models/latlng";
import { Station } from "../../models/station";
import { StopStatus, VehiclePosition } from "../../models/vehiclePosition";

// TODO: cleanup/DRY
// TODO: index === -1 case?
export const height = (pos: VehiclePosition, stationSet: Station[]) => {
  const index = stationSet.findIndex((station) => pos.stationId === station.id);
  let height = 68;

  for (let i = 0; i < index; i += 1) {
    // spacingRatio * 32 = actual px value of bottom margin
    // 24 = height of the station name
    height += stationSet[i].spacingRatio * 32 + 24;
  }

  if (pos.directionId === 0) {
    /* 
    southbound: stationSet is in the order of travel --
    we've added up the bottom margins of stations we are fully past 
    up to (but NOT including) i. now add proportional progress towards i
    */

    if (index === 0) {
      if (pos.stopStatus === StopStatus.StoppedAt) {
        return height;
      } else {
        // handle case where trains InTransitTo are above the stationSet bounds
        return 20;
      }
    }

    if (pos.stopStatus === StopStatus.InTransitTo && pos.position !== null) {
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
    height += stationSet[index].spacingRatio * 32 + 24;
    /*
    northbound: stationSet is in the reverse order of of travel --
    we've added up to (^ and now included above ^) i's bottom margins. Now "backtrack"
    proportionally back towards i 
    */

    if (pos.stopStatus === StopStatus.StoppedAt) {
      if (index === stationSet.length - 1) {
        return height;
      } else {
        return height - (stationSet[index].spacingRatio * 32 + 24);
      }
    }

    //handle case where trains InTransitTo are below stationSet bounds
    if (index === stationSet.length - 1) {
      return height + 40;
    }

    if (pos.position !== null) {
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
};
