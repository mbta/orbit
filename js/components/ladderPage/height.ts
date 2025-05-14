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

  if (stationSet[index].id === "place-brntn") {
    height += 24; // extra padding because "Quincy Adams" wraps
  }

  let travelLength = 0;
  let heightAdjustment = 0;
  if (pos.directionId === 0) {
    // handle case where trains InTransitTo are "above" the first station
    if (index === 0 && pos.stopStatus === StopStatus.InTransitTo) {
      return 20;
    }
    if (pos.stopStatus === StopStatus.StoppedAt) {
      return height;
    }

    // proportionally backtrack progress if train is still in transit towards the station
    if (pos.position !== null) {
      travelLength = stationSet[index - 1].spacingRatio * 32 + 24;
      heightAdjustment =
        (1 -
          proportionBetweenLatLngs(
            stationSet[index - 1].location,
            stationSet[index].location,
            pos.position,
          )) *
        travelLength;
    }
  } else {
    // handle case where trains InTransitTo are "below" the first station
    if (
      index === stationSet.length - 1 &&
      pos.stopStatus === StopStatus.InTransitTo
    ) {
      return height + 40;
    }
    if (pos.stopStatus === StopStatus.StoppedAt) {
      return height;
    }

    /*
    northbound stationSets are in reverse order of travel -- in order to
    backtrack progress towards the station the vp is in relation to,
    we must add on the current station's bottom margin to travel back towards it
    */
    height += stationSet[index].spacingRatio * 32 + 24;
    // proportionally backtrack progress if train is still in transit towards the station
    if (pos.position !== null) {
      travelLength = stationSet[index].spacingRatio * 32 + 24;
      heightAdjustment =
        proportionBetweenLatLngs(
          stationSet[index + 1].location,
          stationSet[index].location,
          pos.position,
        ) * travelLength;
    }
  }
  return height - heightAdjustment;
};
