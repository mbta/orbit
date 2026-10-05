import {
  DirectionalStopIds,
  LadderConfig,
  LadderRungs,
} from "../../data/stations";
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
import { CarId, DirectionId, RouteId } from "../../models/common";
import { Station } from "../../models/station";
import { Vehicle } from "../../models/vehicle";
import { StopStatus } from "../../models/vehiclePosition";
import { consistsEqual, remapLabel } from "../../util/consist";
import { BranchPickerSelection } from "./branchPicker";
import { Ladder } from "rail-tech-ui";
import type { VehicleSelection } from "rail-tech-ui/dist/src/components/ladderPage/types";
import { proportionBetweenLatLngs } from "rail-tech-ui/dist/src/models/latLng";
import { RoutePatternId } from "rail-tech-ui/dist/src/models/route";
import type { TrainLoc } from "rail-tech-ui/dist/src/models/trainLocation";
import { ReactElement, Ref } from "react";

const PROPORTIONAL_PROGRESS_THRESHOLD = 0.6;

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
  externalUrl: station.externalUrl,
  showDots: station.showDots,
  showName: station.showName,
  arrowLeft: station.arrowLeft,
  arrowRight: station.arrowRight,
});

// Transform an Orbit `Vehicle` to a TrainLoc that rail-tech-ui & Glides use
// TODO: After we remove the old ladder, we may be able to standardize on TrainLoc
const vehicleToTrainLoc = (vehicle: Vehicle): TrainLoc => {
  const vp = vehicle.vehiclePosition;
  return {
    consist: vp.cars,
    routeId: vp.routeId,
    directionId: directionIdFromVehicle(vehicle),
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

const directionIdFromVehicle = (vehicle: Vehicle): DirectionId | null => {
  const stopId = vehicle.vehiclePosition.stopId;
  const fixedDirectionForStop =
    (
      stopId !== null &&
      vehicle.vehiclePosition.stopStatus === StopStatus.StoppedAt
    ) ?
      DirectionalStopIds.get(stopId)
    : null;
  return fixedDirectionForStop ?? vehicle.vehiclePosition.directionId;
};

// Tracks which vehicle is selected and which car within its consist was searched for
export type SelectedVehicle = {
  vehicleId: string | null;
  searchedCar?: CarId | null;
};

export const Ladders = ({
  routeId,
  sideBarSelection,
  setSideBarSelection,
  setBranchPickerSelection,
  vehicles,
  ref,
}: {
  routeId: RouteId;
  sideBarSelection: SelectedVehicle | null;
  setSideBarSelection: (selection: SelectedVehicle | null) => void;
  setBranchPickerSelection: (selection: BranchPickerSelection) => void;
  vehicles: Vehicle[];
  ref?: Ref<HTMLDivElement>;
}): ReactElement => {
  const ladderRungsForRoute = LadderRungs[routeId];
  const andrewLatLng = { latitude: 42.330154, longitude: -71.057655 };
  const jfkLatLng = { latitude: 42.320685, longitude: -71.052391 };
  const vehiclesByBranch = vehicles.reduce(
    (accumulator, vehicle) => {
      const vp = vehicle.vehiclePosition;
      let matchingLadderRungs: LadderConfig | undefined;
      // for vehicles in transit to Andrew or JFK, calculate the proportaionl
      // progress and if it exceeds a threshold, "jump" the vehicle to the next ladder rung
      if (
        (vp.stationId === "place-jfk" || vp.stationId === "place-andrw") &&
        vp.stopStatus === StopStatus.InTransitTo &&
        vp.position !== null
      ) {
        const origLatLng =
          vp.stationId === "place-andrw" ? jfkLatLng : andrewLatLng;
        const destLatLng =
          vp.stationId === "place-andrw" ? andrewLatLng : jfkLatLng;

        const prog = proportionBetweenLatLngs(
          origLatLng,
          destLatLng,
          vp.position,
        );

        let branchIndex: number | undefined;
        if (prog >= PROPORTIONAL_PROGRESS_THRESHOLD) {
          if (vp.stationId === "place-andrw") {
            branchIndex = 0;
          } else {
            const routePatternId = vehicle.tripUpdate?.routePatternId;
            if (routePatternId === "Red-1-0") {
              branchIndex = 1;
            } else if (routePatternId === "Red-3-0") {
              branchIndex = 2;
            }
          }
        }
        matchingLadderRungs =
          branchIndex !== undefined ?
            ladderRungsForRoute[branchIndex]
          : undefined;
      } else {
        // --- not in transit to Andrew or JFK -OR- is under PROPORTIONAL_PROGRESS_THRESHOLD
        // find the appropriate ladder rung based on the vehicle's current station
        matchingLadderRungs = ladderRungsForRoute.find((rung) =>
          // check if any station within the current rung array includes the VehiclePosition's stopId
          rung.some((station) => {
            if (station.stop_ids !== undefined) {
              return station.stop_ids.some(
                (stopId) => stopId === vehicle.vehiclePosition.stopId,
              );
            }
          }),
        );
      }
      if (matchingLadderRungs) {
        const vehiclesForLadderRungs = accumulator.get(matchingLadderRungs);
        vehiclesForLadderRungs?.push(vehicle);
      }
      return accumulator;
    },
    // initial map of {[rungs on the ladder]: VehiclePositions[]}
    new Map<LadderConfig, Vehicle[]>(
      ladderRungsForRoute.map((ladderRungs) => [ladderRungs, []]),
    ),
  );

  const onVehicleSelection = (
    selection: VehicleSelection,
    branch: BranchPickerSelection,
  ) => {
    const match = vehicles.find((vehicle) =>
      consistsEqual(
        vehicle.vehiclePosition.cars,
        selection.consist as string[],
      ),
    );
    if (match) {
      setBranchPickerSelection(branch);

      const sameVehicle =
        sideBarSelection !== null &&
        sideBarSelection.vehicleId !== null &&
        sideBarSelection.vehicleId === match.vehiclePosition.vehicleId;
      setSideBarSelection({
        vehicleId: match.vehiclePosition.vehicleId,
        searchedCar: sameVehicle ? sideBarSelection.searchedCar : undefined,
      });
    }
  };

  // Highlight the pill any time the sidebar is showing
  const selectedVehicle =
    sideBarSelection !== null ?
      (vehicles.find(
        (vehicle) =>
          vehicle.vehiclePosition.vehicleId === sideBarSelection.vehicleId,
      ) ?? null)
    : null;
  const selected = selectedVehicle?.vehiclePosition.cars ?? null;

  return (
    <div
      ref={ref}
      data-testid="ladders-scroll-container"
      className="relative flex w-full h-full justify-start min-[1485px]:justify-center overflow-x-auto snap-x snap-mandatory"
    >
      {Array.from(vehiclesByBranch.entries()).map(
        ([ladderRungs, branchVehicles], index) => {
          const branch: BranchPickerSelection = index;

          return (
            <div
              key={index}
              className="h-full mx-40 mt-28 snap-center snap-always"
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
                zoom={47}
                labelMode="lead"
                trainLocs={branchVehicles.map(vehicleToTrainLoc)}
                stationSelection={null}
                // TODO: split scrolling to a train and highlighting a train in rail-tech-ui
                scrollToConsist={selected}
                onVehicleSelection={(selection) => {
                  onVehicleSelection(selection, branch);
                }}
                setStationSelection={() => undefined}
                eastToWestStations={ladderRungs.map(toLadderStation)}
                letterFn={(
                  routeId: RouteId,
                  routePatternId?: RoutePatternId,
                ) => {
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
                highlight={selected}
              />
            </div>
          );
        },
      )}
    </div>
  );
};
