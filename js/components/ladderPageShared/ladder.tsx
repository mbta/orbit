import {
  DirectionalStopIds,
  LadderConfig,
  LadderRungs,
} from "../../data/stations";
import { CarId, DirectionId, RouteId } from "../../models/common";
import { proportionBetweenLatLngs } from "../../models/latlng";
import { Station } from "../../models/station";
import { Vehicle } from "../../models/vehicle";
import { StopStatus } from "../../models/vehiclePosition";
import { consistsEqual, remapLabel } from "../../util/consist";
import { className } from "../../util/dom";
import { BranchPickerSelection } from "./branchPicker";
import { Ladder, StationId } from "rail-tech-ui";
import type { VehicleSelection } from "rail-tech-ui/dist/src/components/ladderPage/types";
import { RoutePatternId } from "rail-tech-ui/dist/src/models/route";
import type { TrainLoc } from "rail-tech-ui/dist/src/models/trainLocation";
import { ReactElement, Ref } from "react";

const PROPORTIONAL_PROGRESS_THRESHOLD = 0.5;

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
  Record<
    RouteId,
    { color: string; letter: string; interLadderStationIds: StationId[] }
  >
> = {
  Red: {
    color: "branch-color-heavy-rail-braintree",
    letter: "-",
    interLadderStationIds: ["place-jfk", "place-andrw"],
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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-assignment
    directionId: directionIdFromVehicle(vehicle),
    ab: vp.cars.map(() => null),
    routePatternId: vehicle.tripUpdate?.routePatternId ?? undefined,
    stationId: vp.stationId,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-assignment
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

const branchIndexForRoutePattern = (vehicle: Vehicle): number | undefined => {
  const routePatternId = vehicle.tripUpdate?.routePatternId;
  if (routePatternId === "Red-1-0" || routePatternId === "Red-1-1") {
    // ashmont
    return 1;
  } else if (routePatternId === "Red-3-0" || routePatternId === "Red-3-1") {
    // braintree
    return 2;
  }
  return undefined;
};

/**
 * A vehicle's stopId is usually the next station on the ladder, but a vehicle
 * running express may skip several stations before reaching it. When the
 * vehicle's position is not between the stopId's station and the station
 * before it, walk along the track to find the stations it is actually between.
 *
 * The ladder positions vehicles by stationId, so it is also synced to the
 * stopId's station when they disagree.
 *
 * The returned vehicle has its stationId set to the station ahead of it on the
 * ladder; the stopId (its real destination) is left unchanged.
 */
export const vehicleWithExpressCorrection = (
  vehicle: Vehicle,
  ladderRungsForRoute: LadderConfig[],
): { vehicle: Vehicle; ladderRungs: LadderConfig } | undefined => {
  const vp = vehicle.vehiclePosition;
  const stationWithLadderConfigIndex = ladderRungsForRoute
    .flatMap((rung, ladderIndex) =>
      rung.map((station) => ({ station, ladderIndex })),
    )
    .find(({ station }) => station.stop_ids?.includes(vp.stopId ?? ""));
  if (stationWithLadderConfigIndex === undefined) return undefined;
  const { station: destinationStation, ladderIndex: destLadderIndex } =
    stationWithLadderConfigIndex;
  const destinationStationId = destinationStation.id;

  // Helper to create a vehicle with a corrected stationId and the corresponding ladder rungs.
  const withStation = (stationId: string | undefined, ladderIndex: number) =>
    // Arrow rungs have no id. The ladder is returned even when the stationId is
    // unchanged, since it may differ from the ladder containing the stopId.
    stationId === undefined ? undefined : (
      {
        vehicle: { ...vehicle, vehiclePosition: { ...vp, stationId } },
        ladderRungs: ladderRungsForRoute[ladderIndex],
      }
    );

  const position = vp.position;
  // vehicle position unknown or is stopped at a station. return with the provided station.
  if (position === null || vp.stopStatus !== StopStatus.InTransitTo) {
    return withStation(destinationStationId, destLadderIndex);
  }

  // Branch ladders continue from the end of the first (trunk) ladder.
  const branchLadderIndex =
    destLadderIndex > 0 ? destLadderIndex : branchIndexForRoutePattern(vehicle);
  const ladderIndexes =
    branchLadderIndex !== undefined && branchLadderIndex > 0 ?
      [0, branchLadderIndex]
    : [destLadderIndex];
  // Filter out arrows and build a "linear" track by joining trunk with a branch ladder
  const track = ladderIndexes.flatMap((ladderIndex) =>
    ladderRungsForRoute[ladderIndex]
      .filter((station) => station.stop_ids !== undefined)
      .map((station) => ({ station, ladderIndex })),
  );

  const destinationIndex = track.findIndex(
    ({ station }) => station === destinationStation,
  );
  // Southbound (0) travels down the ladder, toward increasing indexes.
  const step = vp.directionId === 0 ? 1 : -1;
  // Calculate the progress of the vehicle along the track relative to its destination station.
  const progressTowards = (index: number): number | null => {
    const originIndex = index - step;
    if (
      index < 0 ||
      index >= track.length ||
      originIndex < 0 ||
      originIndex >= track.length
    ) {
      return null;
    }
    // calculate progress of vehicle's position TOWARDS destination station starting FROM the station that is one before the destination station.
    // negative progress means the vehicle is still behind the origin station (expressing towards dest from further out?)
    // progress between 0 and 1 indicates the vehicle is progressing between the station before the destination and the destination station.
    return proportionBetweenLatLngs(
      track[originIndex].station.location,
      track[index].station.location,
      position,
    );
  };
  const betweenAdjacentStations = (
    progress: number | null,
  ): progress is number => progress !== null && progress >= 0 && progress <= 1;

  const progress = progressTowards(destinationIndex);
  if (progress === null || betweenAdjacentStations(progress)) {
    // vehicle is between the station before the destination and the destination station, return the destination station directly.
    return withStation(destinationStationId, destLadderIndex);
  }

  // --- else the vehicle is either behind the station before the destination or past the destination station ---

  // Walk backward along the track when the vehicle is behind its departure
  // station, or forward when it is past its destination.
  const searchStep = progress < 0 ? -step : step;
  const correctedIndex = track
    .map((_, offset) => destinationIndex + searchStep * (offset + 1))
    .find((index) => betweenAdjacentStations(progressTowards(index)));
  if (correctedIndex === undefined) {
    return withStation(destinationStationId, destLadderIndex);
  }

  const { station, ladderIndex } = track[correctedIndex];
  return withStation(station.id, ladderIndex);
};

const matchingLadderRungsForVehicle = (
  vehicle: Vehicle,
  ladderRungsForRoute: LadderConfig[],
): { vehicle: Vehicle; ladderRungs: LadderConfig } | undefined => {
  const andrewLatLng = { latitude: 42.330154, longitude: -71.057655 };
  const jfkLatLng = { latitude: 42.320685, longitude: -71.052391 };
  const expressCorrection = vehicleWithExpressCorrection(
    vehicle,
    ladderRungsForRoute,
  );
  const correctedVehicle = expressCorrection?.vehicle ?? vehicle;
  const vp = correctedVehicle.vehiclePosition;
  let matchingLadderRungs: LadderConfig | undefined;

  // Calculate the progress for vehicles in transit to Andrew or JFK where the Red Line
  //  branches and, if it exceeds a threshold, "jump" the vehicle to the next ladder rung
  if (
    vp.position !== null &&
    vp.stopStatus === StopStatus.InTransitTo &&
    ((vp.stationId === "place-jfk" && vp.directionId === 0) ||
      (vp.stationId === "place-andrw" && vp.directionId === 1))
  ) {
    const origLatLng =
      vp.stationId === "place-andrw" ? jfkLatLng : andrewLatLng;
    const destLatLng =
      vp.stationId === "place-andrw" ? andrewLatLng : jfkLatLng;

    // TODO: import from rail-tech-ui instead of using orbit version?
    const prog = proportionBetweenLatLngs(origLatLng, destLatLng, vp.position);

    let branchIndex: number | undefined;
    if (prog != null && prog < PROPORTIONAL_PROGRESS_THRESHOLD) {
      if (vp.stationId === "place-jfk") {
        branchIndex = 0;
      } else {
        // Vehicle in transit to Andrew, determine branch based on route pattern.
        branchIndex = branchIndexForRoutePattern(vehicle);
      }
      // If prog is over the threshold (i.e. the vehicle has jumped), branchIndex will be undefined.
      // This is handled in ternary in the return statement below.
      matchingLadderRungs =
        branchIndex !== undefined ?
          ladderRungsForRoute[branchIndex]
        : undefined;
    }
  }

  // handles if vehicle is not in transit to Andrew/JFK, or it is but prog is null/over the threshold.
  const ladderRungs =
    matchingLadderRungs ??
    expressCorrection?.ladderRungs ??
    ladderRungsForRoute.find((rung) =>
      // Check if any station within the current rung array includes the VehiclePosition's stopId.
      rung.some((station) =>
        station.stop_ids?.some((stopId) => stopId === vp.stopId),
      ),
    );
  return ladderRungs && { vehicle: correctedVehicle, ladderRungs };
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
  const vehiclesByBranch = vehicles.reduce(
    (accumulator, vehicle) => {
      const match = matchingLadderRungsForVehicle(vehicle, ladderRungsForRoute);

      // find which LadderRungs contains a Station whose id matches the VehiclePosition's station
      if (match) {
        const vehiclesForLadderRungs = accumulator.get(match.ladderRungs);
        vehiclesForLadderRungs?.push(match.vehicle);
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
      className={className([
        "relative flex w-full h-full overflow-x-auto snap-x snap-mandatory",
        sideBarSelection !== null ?
          "justify-start pl-80 scroll-pl-80 min-[2000px]:justify-center min-[2000px]:pl-0 min-[2000px]:scroll-pl-0"
        : "justify-start min-[1485px]:justify-center",
      ])}
    >
      {Array.from(vehiclesByBranch.entries()).map(
        ([ladderRungs, branchVehicles], index) => {
          const branch: BranchPickerSelection = index;

          const interLadderStationIds =
            ROUTE_DEFAULTS[routeId].interLadderStationIds;

          return (
            <div
              key={index}
              data-branch={branch}
              data-testid={`ladder-branch-${branch}`}
              className="h-full mx-40 mt-28 snap-center snap-always"
            >
              <Ladder
                trainsClickable
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
                interLadderStationIds={interLadderStationIds}
              />
            </div>
          );
        },
      )}
    </div>
  );
};
