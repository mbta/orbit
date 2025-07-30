import { SideBarSelection } from "../components/ladderPage/sidebar";
import { estimatedArrival } from "../models/tripUpdate";
import { FullStory } from "@fullstory/browser";

export enum FullStoryEventName {
  SideBarOpened = "Preston test event",
  // TODO: Change to
  // SideBarOpened = "Orbit: Ladder Side Bar Opened"
}

export const trackSideBarOpened = (selection: SideBarSelection) => {
  const { vehicle } = selection;
  const currentTrip = vehicle.ocsTrips.current;
  const nextTrip =
    vehicle.ocsTrips.next.length > 0 ? vehicle.ocsTrips.next[0] : null;

  // Only evaluate "missing" next trip properties if the current trip is assigned a
  // next trip UID by OCS.
  const expectNext = !!currentTrip?.nextUid;

  const missing = Object.entries({
    // OCS Current Trip
    current_trip: !currentTrip,
    current_origin_station: !currentTrip?.originStation,
    current_destination_station: !currentTrip?.destinationStation,
    current_scheduled_departure: !currentTrip?.scheduledDeparture,
    current_scheduled_arrival: !currentTrip?.scheduledArrival,
    current_actual_departure:
      !currentTrip || (currentTrip.departed && !currentTrip.actualDeparture),

    // Other fields associated with current trip
    current_estimated_arrival: !estimatedArrival(vehicle.tripUpdate),

    // OCS Next Trip
    next_trip: expectNext && !nextTrip,
    next_origin_station: expectNext && !nextTrip?.originStation,
    next_destination_station: expectNext && !nextTrip?.destinationStation,
    next_scheduled_departure: expectNext && !nextTrip?.scheduledDeparture,
    next_scheduled_arrival: expectNext && !nextTrip?.scheduledArrival,
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
