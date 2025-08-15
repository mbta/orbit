import { LadderConfig, Stations } from "../../data/stations";
import { useVehicles } from "../../hooks/useVehicles";
import { RouteId } from "../../models/common";
import { Vehicle } from "../../models/vehicle";
import { StopStatus } from "../../models/vehiclePosition";
import { className } from "../../util/dom";
import { height } from "./height";
import { SideBarSelection } from "./sidebar";
import { avoidLabelOverlaps, Train } from "./train";
import {
  TrainTheme,
  TrainThemes,
  trainThemesByRoutePattern,
} from "./trainTheme";
import { ReactElement } from "react";

export const Ladders = ({
  routeId,
  sideBarSelection,
  setSideBarSelection,
}: {
  routeId: RouteId;
  sideBarSelection: SideBarSelection | null;
  setSideBarSelection: (selection: SideBarSelection | null) => void;
}): ReactElement => {
  // TODO: revert when ready for PR
  // const vehicles = useVehicles() ?? [];

  // testing
  const vehicles = [
    // northbound
    {
      vehiclePosition: {
        routeId: "Red",
        revenue: true,
        // "edge case" you must account for
        directionId: 0,
        label: "1800",
        cars: ["1800", "1889"],
        position: { latitude: 42.396207, longitude: -71.141318 },
        stationId: "place-alfcl",
        stopId: "Alewife-01",
        stopStatus: StopStatus.StoppedAt,
        // stopStatus: StopStatus.InTransitTo,
        heading: 85,
        timestamp: null,
        vehicleId: "R-1800",
        tripId: null,
      },
      ocsTrips: { current: null, next: [] },
    },
    {
      vehiclePosition: {
        routeId: "Red",
        revenue: true,
        directionId: 1,
        label: "1900",
        cars: ["1900", "1998"],
        position: { latitude: 42.396118, longitude: -71.139291 },
        stationId: "place-alfcl",
        // stopId: "70061",
        stopId: "Alewife-01",
        stopStatus: StopStatus.InTransitTo,
        heading: 85,
        timestamp: null,
        vehicleId: "R-1900",
        tripId: null,
      },
      ocsTrips: { current: null, next: [] },
    },
    {
      vehiclePosition: {
        routeId: "Red",
        revenue: true,
        directionId: 1,
        label: "1901",
        cars: ["1901", "1997"],
        position: { latitude: 42.398085, longitude: -71.135502 },
        stationId: "place-alfcl",
        // stopId: "70061",
        stopId: "Alewife-01",
        stopStatus: StopStatus.InTransitTo,
        heading: 85,
        timestamp: null,
        vehicleId: "R-1901",
        tripId: null,
      },
      ocsTrips: { current: null, next: [] },
    },
    {
      vehiclePosition: {
        routeId: "Red",
        revenue: true,
        directionId: 1,
        label: "1776",
        cars: ["1776", "1777"],
        position: { latitude: 42.398085, longitude: -71.135502 },
        stationId: "place-alfcl",
        // stopId: "70061",
        stopId: "Alewife-01",
        stopStatus: StopStatus.InTransitTo,
        heading: 85,
        timestamp: null,
        vehicleId: "R-1776",
        tripId: null,
      },
      ocsTrips: { current: null, next: [] },
    },
    // southbound
    {
      vehiclePosition: {
        routeId: "Red",
        revenue: true,
        directionId: 0,
        label: "1888",
        cars: ["1888", "1889"],
        position: { latitude: 42.39674, longitude: -71.121815 },
        stationId: "place-davis",
        stopId: "70063",
        stopStatus: StopStatus.StoppedAt,
        // stopStatus: StopStatus.InTransitTo,
        heading: 85,
        timestamp: null,
        vehicleId: "R-1888",
        tripId: null,
      },
      ocsTrips: { current: null, next: [] },
    },
    {
      vehiclePosition: {
        routeId: "Red",
        revenue: true,
        directionId: 0,
        label: "1999",
        cars: ["1999", "1998"],
        position: { latitude: 42.397348, longitude: -71.124904 },
        stationId: "place-davis",
        stopId: "70063",
        stopStatus: StopStatus.InTransitTo,
        heading: 85,
        timestamp: null,
        vehicleId: "R-1999",
        tripId: null,
      },
      ocsTrips: { current: null, next: [] },
    },
    {
      vehiclePosition: {
        routeId: "Red",
        revenue: true,
        directionId: 0,
        label: "2000",
        cars: ["2000", "1998"],
        position: { latitude: 42.397348, longitude: -71.124904 },
        stationId: "place-davis",
        stopId: "70063",
        stopStatus: StopStatus.InTransitTo,
        heading: 85,
        timestamp: null,
        vehicleId: "R-2000",
        tripId: null,
      },
      ocsTrips: { current: null, next: [] },
    },
    {
      vehiclePosition: {
        routeId: "Red",
        revenue: true,
        directionId: 0,
        label: "2025",
        cars: ["2025", "1998"],
        position: { latitude: 42.397762, longitude: -71.130197 },
        stationId: "place-davis",
        stopId: "70063",
        stopStatus: StopStatus.InTransitTo,
        heading: 85,
        timestamp: null,
        vehicleId: "R-2025",
        tripId: null,
      },
      ocsTrips: { current: null, next: [] },
    },
  ];

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

  return (
    <div className="relative flex w-full justify-start min-[1485px]:justify-center overflow-x-auto snap-x snap-mandatory">
      {Array.from(vehiclesByBranch.entries()).map(
        ([stationList, vehicles], index) => (
          <TrainsAndStations
            key={index}
            ladderConfig={stationList}
            vehicles={vehicles}
            sideBarSelection={sideBarSelection}
            setSideBarSelection={setSideBarSelection}
          />
        ),
      )}
    </div>
  );
};

type TrainHeights = {
  dotHeight: number | null;
  labelHeight?: number | null;
};

export type VehicleWithHeight = {
  vehicle: Vehicle;
  heights: TrainHeights;
};

const TrainsAndStations = ({
  ladderConfig,
  vehicles,
  sideBarSelection,
  setSideBarSelection,
}: {
  ladderConfig: LadderConfig;
  vehicles: Vehicle[];
  sideBarSelection: SideBarSelection | null;
  setSideBarSelection: (selection: SideBarSelection | null) => void;
}): ReactElement => {
  const vehiclesWithHeights: VehicleWithHeight[] = vehicles.map((vehicle) => {
    const { vehiclePosition: vp } = vehicle;
    // should still be able to render trains that are StoppedAt a station,
    // even if they have a null position
    if (vp.position == null && vp.stopStatus !== StopStatus.StoppedAt) {
      return { vehicle: vehicle, heights: { dotHeight: null } };
    }

    const trainHeight = height(vp, ladderConfig);
    if (trainHeight === -1) {
      console.error(
        `VehiclePosition with label: ${vp.label}, vehicleId: ${vp.vehicleId} not found on station list.`,
      );
      return { vehicle: vehicle, heights: { dotHeight: null } };
    } else if (trainHeight === null) {
      console.error(
        `unable to calculate position for VehiclePosition with label: ${vp.label}, vehicleId: ${vp.vehicleId}`,
      );
      return { vehicle: vehicle, heights: { dotHeight: null } };
    }
    // add 80 for top margin above the station list borders
    return { vehicle: vehicle, heights: { dotHeight: trainHeight + 80 } };
  });

  // TODO: do we need a tie-breaker if somehow the vehicles are at the same height?
  //  -> go by timestamp (i.e whichever vehicle got there first)
  const sortedVehiclesByHeight = [
    ...vehiclesWithHeights.filter(
      (vehicle) => vehicle.heights.dotHeight !== null,
    ),
  ].sort((v1, v2) => {
    const v1DotHeight = v1.heights.dotHeight;
    const v2DotHeight = v2.heights.dotHeight;
    return v1DotHeight && v2DotHeight ? v1DotHeight - v2DotHeight : 0;
  });

  const processedSortedVehicles = avoidLabelOverlaps(sortedVehiclesByHeight);

  // TODO: remove
  // just a sanity check of the sorting from above ^ -----------------------------------------------------
  // sortedVehiclesByHeight.forEach((sortedV) => {
  //   console.log(
  //     `${sortedV.vehicle.vehiclePosition.label}, height: ${sortedV.heights.dotHeight}, direction: ${sortedV.vehicle.vehiclePosition.directionId}`,
  //   );
  // });

  // processedSortedVehicles.forEach((processedV) => {
  //   console.log(
  //     `${processedV.vehicle.vehiclePosition.label}, height: ${processedV.heights.dotHeight}, labelHeight: ${processedV.heights.labelHeight ?? "NONE"}, direction: ${processedV.vehicle.vehiclePosition.directionId}`,
  //   );
  // });

  // processedSortedVehicles.forEach((processedV) => {
  //   if (processedV.heights.labelHeight) {
  //     console.log(
  //       `${processedV.vehicle.vehiclePosition.label}, labelHeight: ${processedV.heights.labelHeight}, direction: ${processedV.vehicle.vehiclePosition.directionId}`,
  //     );
  //   }
  // });

  return (
    <div className="relative flex snap-center snap-always">
      <StationList stations={ladderConfig} />

      {processedSortedVehicles.map((vehicleWithHeight) => {
        const vp = vehicleWithHeight.vehicle.vehiclePosition;

        const trainTheme = themeForVehicleOnLadder(
          vehicleWithHeight.vehicle,
          ladderConfig,
        );

        const station = ladderConfig.find((station) =>
          station.stop_ids.some((stop_id) => stop_id === vp.stopId),
        );

        const direction =
          vp.stopId !== null ?
            (station?.forcedDirections?.get(vp.stopId) ?? vp.directionId)
          : vp.directionId;

        return (
          <div
            key={vp.vehicleId}
            style={{
              position: "absolute",
              top: `${vehicleWithHeight.heights.dotHeight}px`,
            }}
            className={className([
              "pointer-events-none",
              direction === 0 ? "left-[24px]" : "right-[24px]",
            ])}
          >
            <Train
              theme={trainTheme}
              vehicle={vehicleWithHeight.vehicle}
              forceDirection={direction}
              labelHeight={vehicleWithHeight.heights.labelHeight ?? null}
              highlight={
                vp.label === sideBarSelection?.vehicle.vehiclePosition.label
              }
              setSideBarSelection={setSideBarSelection}
            />
          </div>
        );
      })}
    </div>
  );
};

const StationList = ({
  stations,
}: {
  stations: LadderConfig;
}): ReactElement => {
  return (
    <div className="mt-20 mb-20">
      <ul className="relative mx-36 w-32 border-x-[6px] border-solid border-gray-300">
        {/* northbound arrow on top right */}
        <div className="absolute right-[-18px] top-0 w-0 h-0 border-l-[15px] border-l-white border-r-[15px] border-r-white border-b-[25px] border-b-gray-300" />
        {/* southbound arrow on bottom left */}
        <div className="absolute bottom-0 left-[-18px] w-0 h-0 border-l-[15px] border-l-white border-r-[15px] border-r-white border-t-[25px] border-t-gray-300" />

        {stations.map((station) => {
          const stationId = station.id;
          return (
            <li
              key={stationId}
              style={{ marginBottom: station.spacingRatio * 32 }}
              className={
                stationId == "place-alfcl" ? "pt-20"
                : stationId == "place-andrw" ?
                  "pb-20"
                : stationId == "place-jfk" ?
                  "pt-20"
                : stationId == "place-asmnl" ?
                  "pb-20"
                : stationId == "place-brntn" ?
                  "pb-20"
                : ""
              }
            >
              {/* station dots on left and right */}
              <div className="absolute bg-white mt-0.5 left-[-13px] size-5 rounded-full border-4 border-gray-300" />
              <div className="absolute bg-white mt-0.5 right-[-13px] size-5 rounded-full border-4 border-gray-300" />
              <div className="text-center mx-auto text-wrap w-24">
                {station.name}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

const themeForVehicleOnLadder = (
  vehicle: Vehicle,
  ladderConfig: LadderConfig,
): TrainTheme => {
  if (!vehicle.vehiclePosition.revenue) {
    return TrainThemes.gray;
  }

  const routePatternId = vehicle.tripUpdate?.routePatternId;
  const themeFromRoute =
    routePatternId != null ?
      trainThemesByRoutePattern.get(routePatternId)
    : null;
  if (themeFromRoute) {
    return themeFromRoute;
  }

  // Route pattern is missing or unfamiliar. Guess colors based on current
  // ladder segment, with Braintree colors as fallback.
  const isAshmontLadder = ladderConfig.some(
    (station) => station.id === "place-asmnl",
  );
  return isAshmontLadder ? TrainThemes.tangerine : TrainThemes.crimson;
};
