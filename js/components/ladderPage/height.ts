import { LadderConfig } from "../../data/stations";
import { LatLng, proportionBetweenLatLngs } from "../../models/latlng";
import { StopStatus, VehiclePosition } from "../../models/vehiclePosition";

export const height = (pos: VehiclePosition, stationList: LadderConfig) => {
  let height = 68;
  let index = -1;
  // add up the bottom margins of stations while finding the vp's station's index
  // this will get us right up to the station on the ladder
  for (let i = 0; i < stationList.length; i += 1) {
    if (pos.stationId === stationList[i].id) {
      index = i;
      break;
    }
    // spacingRatio * 32 = actual px value of bottom margin
    // 24 = height of the station name
    height += stationList[i].spacingRatio * 32 + 24;
  }

  // somehow the vp was not in the correct stationlist (unlikely)
  if (index === -1) {
    return -1;
  }

  const currentStation = stationList[index];
  if (currentStation.id === "place-brntn") {
    height += 24; // extra padding because "Quincy Adams" wraps
  }
  if (pos.stopStatus === StopStatus.StoppedAt) {
    return height;
  }

  // --- proportionally backtrack progress if train is still in transit towards the station ---

  // handle case where trains InTransitTo are "above" the first station
  if (pos.directionId === 0 && index === 0) {
    return 20;
  }
  // handle case where trains InTransitTo are "below" the first station
  if (pos.directionId === 1 && index === stationList.length - 1) {
    return height + 40;
  }

  const start =
    pos.directionId === 0 ?
      stationList[index - 1].location
    : stationList[index + 1].location;

  const finish = currentStation.location;

  const travelLength =
    pos.directionId === 0 ?
      stationList[index - 1].spacingRatio * 32 + 24
    : currentStation.spacingRatio * 32 + 24;

  // northbound StationLists are in reverse order of travel (up). to backtrack
  // progress towards the station the vp is in relation to, we must add on the
  // current station's bottom margin (aka the travelLength) to travel back towards it
  if (pos.directionId === 1) {
    height += travelLength;
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
  const proportionBetweenStartFinish = proportionBetweenLatLngs(
    start,
    finish,
    point,
  );
  if (direction === 0) {
    return (1 - proportionBetweenStartFinish) * travelLength;
  } else {
    return proportionBetweenStartFinish * travelLength;
  }
};
