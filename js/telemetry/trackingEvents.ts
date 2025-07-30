import { SideBarSelection } from "../components/ladderPage/sidebar";
import { estimatedArrival } from "../models/tripUpdate";
import { FullStory } from "@fullstory/browser";

export enum FullStoryEventName {
  SideBarOpened = "Orbit: Ladder Side Bar Opened",
}

export const trackSideBarOpened = (selection: SideBarSelection) => {
  const { vehicle } = selection;
  const currentTrip = vehicle.ocsTrips.current;
  const nextTrip =
    vehicle.ocsTrips.next.length > 0 ? vehicle.ocsTrips.next[0] : null;

  const missingCurrent = {
    current_trip: !currentTrip,
    current_origin_station: !currentTrip?.originStation,
    current_destination_station: !currentTrip?.destinationStation,
    current_scheduled_departure: !currentTrip?.scheduledDeparture,
    current_scheduled_arrival: !currentTrip?.scheduledArrival,
    current_actual_departure:
      !currentTrip || (currentTrip.departed && !currentTrip.actualDeparture),

    // Other fields associated with current trip
    current_estimated_arrival: !estimatedArrival(vehicle.tripUpdate),
  };

  // If we have a currentTrip, and said trip does not have an assigned nextUid, then assume
  // the next trip is intentionally unset (ie, does not exist) and therefore not "missing".
  const ignoreNextTrip = currentTrip && !currentTrip.nextUid;
  const missingNext =
    ignoreNextTrip ?
      {}
    : {
        next_trip: !nextTrip,
        next_origin_station: !nextTrip?.originStation,
        next_destination_station: !nextTrip?.destinationStation,
        next_scheduled_departure: !nextTrip?.scheduledDeparture,
        next_scheduled_arrival: !nextTrip?.scheduledArrival,
      };

  const missing = Object.entries({
    ...missingCurrent,
    ...missingNext,
  })
    .filter(([_, value]) => value)
    .map(([key, _]) => key)
    .sort();

  FullStory("trackEvent", {
    name: FullStoryEventName.SideBarOpened,
    properties: {
      train_uid: vehicle.vehiclePosition.vehicleId,
      gtfs_trip_id: vehicle.tripUpdate?.tripId,
      ocs_current_trip_uid: currentTrip?.uid ?? null,
      ocs_next_trip_uid: currentTrip?.nextUid ?? null,
      missing_data: missing,
    },
  });
};
