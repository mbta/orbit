import { LadderConfig, Stations } from "../../data/stations";
import { useTripUpdates } from "../../hooks/useTripUpdates";
import { useVehiclePositions } from "../../hooks/useVehiclePositions";
import { RouteId } from "../../models/common";
import {
  Vehicle,
  vehiclesFromPositionsAndTripUpdates,
} from "../../models/vehicle";
import { StopStatus } from "../../models/vehiclePosition";
import { height } from "./height";
import { Train } from "./train";
import {
  TrainTheme,
  trainThemeFromRoutePatternId,
  TrainThemes,
} from "./trainTheme";
import { ReactElement } from "react";

export const Ladders = ({ routeId }: { routeId: RouteId }): ReactElement => {
  const tripUpdates = useTripUpdates();
  const vehiclePositions = useVehiclePositions();
  const stationLists = Stations[routeId];
  const vehicles = vehiclesFromPositionsAndTripUpdates(
    vehiclePositions ?? [],
    tripUpdates ?? [],
  );

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
    <>
      <span>
        Status:{" "}
        {vehiclePositions !== null && tripUpdates !== null ?
          <>
            Connected ({vehiclePositions.length} vehicles, {tripUpdates.length}{" "}
            tripUpdates)
          </>
        : <>Loading...</>}
      </span>

      {/* outer <div> prevents horizontal overflow from affecting the overall page layout
      inner <div> enables horizontal overflow (scrolling) for the 3 StationLists
      ^ this should potentially be handled in a future <LadderPage />. */}
      <div className="overflow-x-hidden">
        <div className="relative flex px-80 overflow-x-auto">
          {Array.from(vehiclesByBranch.entries()).map(
            ([stationList, vehicles], index) => (
              <TrainsAndStations
                key={index}
                ladderConfig={stationList}
                vehicles={vehicles}
              />
            ),
          )}
        </div>
      </div>
    </>
  );
};

const TrainsAndStations = ({
  ladderConfig,
  vehicles,
}: {
  ladderConfig: LadderConfig;
  vehicles: Vehicle[];
}): ReactElement => {
  const themeForVehicle = (vehicle: Vehicle): TrainTheme => {
    const routePatternId = vehicle.tripUpdate?.routePatternId;
    const themeFromRoute =
      routePatternId != null ?
        trainThemeFromRoutePatternId(routePatternId)
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

  return (
    <div className="relative flex">
      <StationList stations={ladderConfig} />
      {vehicles.map((vehicle) => {
        const { vehiclePosition: vp } = vehicle;
        // should still be able to render trains that ARE StoppedAt a station,
        // even if they have a null position
        if (vp.position === null && vp.stopStatus !== StopStatus.StoppedAt) {
          return null;
        }

        const trainHeight = height(vp, ladderConfig);
        if (trainHeight === -1) {
          console.error(
            `VehiclePosition with label: ${vp.label}, vehicleId: ${vp.vehicleId} not found on station list.`,
          );
          return null;
        } else if (trainHeight === null) {
          console.error(
            `unable to calculate position for VehiclePosition with label: ${vp.label}, vehicleId: ${vp.vehicleId}`,
          );
          return null;
        }
        // add 80 for top margin above the station list borders
        const px = trainHeight + 80;

        const trainTheme = themeForVehicle(vehicle);

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
            style={{ position: "absolute", top: `${px}px` }}
            className={direction === 0 ? "left-[24px]" : "right-[24px]"}
          >
            <Train theme={trainTheme} label={vp.label} direction={direction} />
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
