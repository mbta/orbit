import { LadderConfig, Stations } from "../../data/stations";
import {
  ORBIT_HR_DISPATCHERS,
  ORBIT_HR_STAKEHOLDERS,
  ORBIT_RL_CHIEF_INSPECTORS,
  ORBIT_RL_INSPECTORS,
  ORBIT_RL_TRAINSTARTERS,
  ORBIT_RL_YARDMASTERS,
  ORBIT_TID_STAFF,
  userHasOneOf,
} from "../../groups";
import { CarId, RouteId } from "../../models/common";
import { Station } from "../../models/station";
import { Vehicle } from "../../models/vehicle";
import { consistsEqual, remapLabel } from "../../util/consist";
import { SideBarSelection } from "./sidebar";
import { Ladder } from "rail-tech-ui";
import type { VehicleSelection } from "rail-tech-ui/dist/src/components/ladderPage/types";
import { RoutePatternId } from "rail-tech-ui/dist/src/models/route";
import type { TrainLoc } from "rail-tech-ui/dist/src/models/trainLocation";
import { ReactElement } from "react";

const ROUTE_PATTERN_CONFIG: Readonly<
  Record<RouteId, Record<RoutePatternId, { color: string; letter: string }>>
> = {
  Red: {
    "Red-1-0": {
      color: "branch-color-heavy-rail-ashmont",
      letter: "A",
    },
    "Red-1-1": {
      color: "branch-color-heavy-rail-ashmont",
      letter: "A",
    },
    "Red-3-0": {
      color: "branch-color-heavy-rail-braintree",
      letter: "B",
    },
    "Red-3-1": {
      color: "branch-color-heavy-rail-braintree",
      letter: "B",
    },
  },
};

const ROUTE_DEFAULTS: Readonly<
  Record<RouteId, { color: string; letter: string }>
> = {
  Red: {
    color: "branch-color-heavy-rail-braintree",
    letter: "-",
  },
};

type TrainHeight = {
  dotHeight: number | null;
  labelOffset?: number | null;
};

// Re-exported for consumers (height.ts, train.tsx and their tests) that still
// operate on vehicles annotated with a height
export type VehicleWithHeight = {
  vehicle: Vehicle;
  heights: TrainHeight;
};

// Adapt Orbit's Station (uses `location`, no `shortName`) to rail-tech-ui's
// LadderStation shape (`latLng`, requires `shortName`).
// TODO: After we remove the old ladder, this can be simplified
const toLadderStation = (station: Station) => ({
  id: station.id,
  name: station.name,
  shortName: station.name,
  latLng: station.location,
  spacingRatio: station.spacingRatio,
});

// Transform an Orbit `Vehicle` to a TrainLoc that rail-tech-ui & Glides use
// TODO: After we remove the old ladder, we may be able to standardize on TrainLoc
const vehicleToTrainLoc = (vehicle: Vehicle): TrainLoc => {
  const vp = vehicle.vehiclePosition;
  return {
    consist: vp.cars,
    routeId: vp.routeId,
    directionId: vp.directionId,
    ab: vp.cars.map(() => null),
    routePatternId: vehicle.tripUpdate?.routePatternId ?? undefined,
    stationId: vp.stationId,
    stopStatus: vp.stopStatus,
    latLng: vp.position,
    heading: vp.heading,
    timestamp: vp.timestamp,
    trip: { scheduled: { revenue: vp.revenue }, manual: null },
  };
};

export const Ladders = ({
  routeId,
  sideBarSelection,
  setSideBarSelection,
  vehicles,
}: {
  routeId: RouteId;
  sideBarSelection: SideBarSelection | null;
  setSideBarSelection: (selection: SideBarSelection | null) => void;
  vehicles: Vehicle[];
}): ReactElement => {
  const stationLists = Stations[routeId];
  const vehiclesByBranch = vehicles.reduce(
    (accumulator, vehicle) => {
      // find which StationList contains a Station whose id matches the VehiclePosition's station
      const matchingStationList = stationLists.find((stations) =>
        // check if any station within the current stations array includes the VehiclePosition's stopId
        stations.some((station) =>
          station.stop_ids.some(
            (stopId) => stopId === vehicle.vehiclePosition.stopId,
          ),
        ),
      );
      if (matchingStationList) {
        const vehiclesForStationList = accumulator.get(matchingStationList);
        vehiclesForStationList?.push(vehicle);
      }
      return accumulator;
    },
    // initial map of {[stations on the ladder]: VehiclePositions[]}
    new Map<LadderConfig, Vehicle[]>(
      stationLists.map((stationList) => [stationList, []]),
    ),
  );

  const onVehicleSelection = (selection: VehicleSelection) => {
    const match = vehicles.find((vehicle) =>
      consistsEqual(
        vehicle.vehiclePosition.cars,
        selection.consist as string[],
      ),
    );
    if (match) {
      const sameVehicle =
        sideBarSelection !== null &&
        consistsEqual(
          sideBarSelection.vehicle.vehiclePosition.cars,
          selection.consist as string[],
        );
      setSideBarSelection({
        vehicle: match,
        searchedCar: sameVehicle ? sideBarSelection.searchedCar : undefined,
      });
    }
  };

  // Scroll into view only when the user found the vehicle via search; keeps
  // parity with the previous scrollIntoView behavior.
  const scrollToConsist =
    sideBarSelection?.searchedCar != null ?
      sideBarSelection.vehicle.vehiclePosition.cars
    : null;

  return (
    <div className="relative flex w-full h-full justify-start min-[1485px]:justify-center overflow-x-auto snap-x snap-mandatory">
      {Array.from(vehiclesByBranch.entries()).map(
        ([stationList, branchVehicles], index) => (
          <div
            key={index}
            className="h-full mx-40 mt-20 snap-center snap-always"
          >
            <Ladder
              trainsClickable={userHasOneOf([
                ORBIT_HR_DISPATCHERS,
                ORBIT_HR_STAKEHOLDERS,
                ORBIT_RL_CHIEF_INSPECTORS,
                ORBIT_RL_INSPECTORS,
                ORBIT_RL_TRAINSTARTERS,
                ORBIT_RL_YARDMASTERS,
                ORBIT_TID_STAFF,
              ])}
              zoom={70}
              labelMode="lead"
              trainLocs={branchVehicles.map(vehicleToTrainLoc)}
              stationSelection={null}
              scrollToConsist={scrollToConsist}
              onVehicleSelection={onVehicleSelection}
              setStationSelection={() => undefined}
              eastToWestStations={stationList.map(toLadderStation)}
              letterFn={(routeId: RouteId, routePatternId?: RoutePatternId) => {
                if (routePatternId !== undefined) {
                  return ROUTE_PATTERN_CONFIG[routeId][routePatternId].letter;
                }

                return ROUTE_DEFAULTS[routeId].letter;
              }}
              routeColorFn={(
                routeId: RouteId,
                routePatternId?: RoutePatternId,
              ) => {
                if (routePatternId !== undefined) {
                  return ROUTE_PATTERN_CONFIG[routeId][routePatternId].color;
                }

                return ROUTE_DEFAULTS[routeId].color;
              }}
              labelRemap={(car: CarId) => remapLabel(car, routeId)}
              getInitialPredictionsDirection={() => 0}
            />
          </div>
        ),
      )}
    </div>
  );
};
