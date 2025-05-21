import { LatLng, proportionBetweenLatLngs } from "../../models/latlng";
import { Station } from "../../models/station";
import { StopStatus, VehiclePosition } from "../../models/vehiclePosition";

export const height = (pos: VehiclePosition, stationSet: Station[]) => {
  let height = 68;
  let index = -1;
  // add up the bottom margins of stations while finding the vp's station's index
  // this will get us right up to the station on the ladder
  for (let i = 0; i < stationSet.length; i += 1) {
    if (pos.stationId === stationSet[i].id) {
      index = i;
      break;
    }
    // spacingRatio * 32 = actual px value of bottom margin
    // 24 = height of the station name
    height += stationSet[i].spacingRatio * 32 + 24;
  }

  // somehow the vp was not in the correct stationlist (unlikely)
  if (index === -1) {
    return -1;
  }
  if (stationSet[index].id === "place-brntn") {
    height += 24; // extra padding because "Quincy Adams" wraps
  }
  if (pos.stopStatus === StopStatus.StoppedAt) {
    return height;
  }

  // proportionally backtrack progress if train is still in transit towards the station
  let start: LatLng = { latitude: 0.0, longitude: 0.0 };
  const finish = stationSet[index].location;
  let travelLength = 0.0;
  if (pos.directionId === 0) {
    // handle case where trains InTransitTo are "above" the first station
    if (index === 0) {
      return 20;
    }
    start = stationSet[index - 1].location;
    travelLength = stationSet[index - 1].spacingRatio * 32 + 24;
  } else {
    // handle case where trains InTransitTo are "below" the first station
    if (index === stationSet.length - 1) {
      return height + 40;
    }

    // northbound stationSets are in reverse order of travel -- in order to
    // backtrack progress towards the station the vp is in relation to,
    // we must add on the current station's bottom margin to travel back towards it
    height += stationSet[index].spacingRatio * 32 + 24;

    start = stationSet[index + 1].location;
    travelLength = stationSet[index].spacingRatio * 32 + 24;
  }
  if (pos.position !== null) {
    height -= proportionalProgress(
      start,
      finish,
      pos.position,
      travelLength,
      pos.directionId,
    );
  }
  return height;
};

const proportionalProgress = (
  start: LatLng,
  finish: LatLng,
  point: LatLng,
  travelLength: number,
  direction: number,
) => {
  if (direction === 0) {
    return (1 - proportionBetweenLatLngs(start, finish, point)) * travelLength;
  } else {
    return proportionBetweenLatLngs(start, finish, point) * travelLength;
  }
};
