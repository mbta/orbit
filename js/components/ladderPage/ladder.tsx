import { useTripUpdates } from "../../hooks/useTripUpdates";
import { useVehiclePositions } from "../../hooks/useVehiclePositions";
import { Station } from "../../models/station";
import { StopStatus, VehiclePosition } from "../../models/vehiclePosition";
import { height } from "./height";
import { Train } from "./train";
import { ReactElement } from "react";

export const Ladder = ({
  stationSets,
}: {
  stationSets: Station[][];
}): ReactElement => {
  const tripUpdates = useTripUpdates();
  const vehiclePositions = useVehiclePositions();

  // categorize the vp's by which branch (stationset) they're on
  // create a new map of each StationSet -> array of vps located on that set
  const vpsByBranch = vehiclePositions?.reduce(
    (accumulator, vp) => {
      // find which StationSet contains a Station whose id matches the VehiclePosition's station
      const matchingStationSet = stationSets.find((stations) =>
        // check if any station within the current stations array includes the VehiclePosition's stopId
        stations.some((station) =>
          station.stop_ids.some((stopId) => stopId === vp.stopId),
        ),
      );

      if (matchingStationSet) {
        const vpsForStationSet = accumulator.get(matchingStationSet);
        vpsForStationSet?.push(vp);
      }

      return accumulator;
    },
    // initial map of {StationSets: VehiclePositions[]}
    new Map<(typeof stationSets)[number], VehiclePosition[]>(
      stationSets.map((stationSet) => [stationSet, []]),
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
          {vpsByBranch &&
            Array.from(vpsByBranch.entries()).map(
              ([stationSets, vps], index) => (
                <TrainsAndStations
                  key={index}
                  stations={stationSets}
                  vps={vps}
                />
              ),
            )}
        </div>
      </div>
    </>
  );
};

const TrainsAndStations = ({
  stations,
  vps,
}: {
  stations: Station[];
  vps: VehiclePosition[];
}): ReactElement => {
  return (
    <div className="relative flex">
      <StationList stations={stations} />
      {vps.map((vp) => {
        if (vp.position === null && vp.stopStatus !== StopStatus.StoppedAt) {
          return null;
        }

        const trainHeight = height(vp, stations);

        // add 80 for top margin above the station list borders
        const px = trainHeight == -1 ? -1 : trainHeight + 80;
        if (px === -1) {
          console.error(
            `VehiclePosition ${vp.vehicleId} not found on station list.`,
          );
          return null;
        }

        // TODO: this flat-out ignores that Ashmont-bound trains may be on the main ladder
        const route =
          stations.some((station) => station.id === "place-asmnl") ?
            "Red-Ashmont"
          : "Red-Braintree";

        const direction =
          vp.stopId && ["Alewife-02", "Braintree-02"].includes(vp.stopId) ? 0
          : vp.stopId && ["Alewife-01", "Braintree-01"].includes(vp.stopId) ? 1
          : vp.directionId;

        return (
          <div
            key={vp.vehicleId}
            style={{ position: "absolute", top: `${px}px` }}
            className={direction === 0 ? "left-[24px]" : "right-[24px]"}
          >
            <Train route={route} label={vp.label} direction={direction} />
          </div>
        );
      })}
    </div>
  );
};

const StationList = ({ stations }: { stations: Station[] }): ReactElement => {
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
