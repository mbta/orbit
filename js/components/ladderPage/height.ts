import { proportionBetweenLatLngs } from "../../models/latlng";
import { Station } from "../../models/station";
import { StopStatus, VehiclePosition } from "../../models/vehiclePosition";

// TODO: index === -1 case?
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

  if (pos.directionId === 0) {
    // handle case where trains InTransitTo are "above" the first station
    if (index === 0 && pos.stopStatus === StopStatus.InTransitTo) {
      return 20;
    }

    // proportionally backtrack progress if train is still in transit towards the station
    if (pos.position !== null && pos.stopStatus === StopStatus.InTransitTo) {
      height -=
        (1 -
          proportionBetweenLatLngs(
            stationSet[index - 1].location,
            stationSet[index].location,
            pos.position,
          )) *
        (stationSet[index - 1].spacingRatio * 32 + 24);
    }
    return height;
  } else {
    if (stationSet[index].id === "place-brntn") {
      height += 24; // extra padding because "Quincy Adams" wraps
    }

    if (pos.stopStatus === StopStatus.StoppedAt) {
      return height;
    }

    // ------ train is InTransitTo ------

    // handle case where trains InTransitTo are "below" the first station
    if (index === stationSet.length - 1) {
      return height + 40;
    }

    /*
    northbound stationSets are in reverse order of travel --
    in order to backtrack progress towards the station the vp 
    is in relation to, we must add on the current station's bottom margin
    to travel back towards it
    */
    height += stationSet[index].spacingRatio * 32 + 24;
    if (pos.position !== null) {
      height -=
        proportionBetweenLatLngs(
          stationSet[index + 1].location,
          stationSet[index].location,
          pos.position,
        ) *
        (stationSet[index].spacingRatio * 32 + 24);
    }
    return height;
  }
};
