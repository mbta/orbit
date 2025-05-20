import { LatLng, proportionBetweenLatLngs } from "../../models/latlng";
import { Station } from "../../models/station";
import { StopStatus, VehiclePosition } from "../../models/vehiclePosition";

export const height = (pos: VehiclePosition, stationSet: Station[]) => {
  const index = stationSet.findIndex((station) => pos.stationId === station.id);
  let height = 68;

  // add up the bottom margins of stations up to index
  // this will get us to the station that the vp is in relation to
  for (let i = 0; i < index; i += 1) {
    // spacingRatio * 32 = actual px value of bottom margin
    // 24 = height of the station name
    height += stationSet[i].spacingRatio * 32 + 24;
  }

  if (stationSet[index].id === "place-brntn") {
    height += 24; // extra padding because "Quincy Adams" wraps
  }

  if (pos.stopStatus === StopStatus.StoppedAt) {
    return height;
  }

  let start: LatLng = { latitude: 0.0, longitude: 0.0 };
  let finish: LatLng = { latitude: 0.0, longitude: 0.0 };
  let travelLength = 0.0;
  if (pos.directionId === 0) {
    // handle case where trains InTransitTo are "above" the first station
    if (index === 0) {
      return 20;
    }
    start = stationSet[index - 1].location;
    finish = stationSet[index].location;
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
    finish = stationSet[index].location;
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

// proportionally backtrack progress if train is still in transit towards the station
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
