import { SideBarSelection } from "../components/ladderPage/sidebar";
import { OCSTrip } from "../models/ocs";
import { FullStory } from "@fullstory/browser";

export enum FullStoryEventName {
  SideBarOpened = "Preston test event",
  // TODO: Change to
  // SideBarOpened = "Orbit: Ladder Side Bar Opened"
}

export const trackSideBarOpened = (selection: SideBarSelection) => {
  const { vehicle } = selection;
  const currentTrip = vehicle.ocsTrips.current;
  const [nextTrip] = vehicle.ocsTrips.next;

  const missingFromCurrent = missingOcsTripProperties(currentTrip).map(
    (property) => `current_${property}`,
  );

  // Only evaluate "missing" next trip properties if the current trip is assigned a
  // next trip UID by OCS.
  const hasNext = currentTrip?.nextUid;
  const missingFromNext =
    hasNext ?
      missingOcsTripProperties(nextTrip).map((property) => `next_${property}`)
    : [];

  const missing = [...missingFromCurrent, ...missingFromNext].sort();

  FullStory("trackEvent", {
    // TODO
    name: FullStoryEventName.SideBarOpened,
    properties: {
      train_uid: vehicle.vehiclePosition.vehicleId,
      missing_data: missing,
    },
  });
};

const missingOcsTripProperties = (trip: OCSTrip | null) => {
  return Object.entries({
    trip: !trip,
    origin_station: !trip?.originStation,
    destination_station: !trip?.destinationStation,
    scheduled_departure: !trip?.scheduledDeparture,
    scheduled_arrival: !trip?.scheduledArrival,
  })
    .filter(([_, value]) => !!value)
    .map(([key, _]) => key);
};
