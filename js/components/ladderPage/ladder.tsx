import { StationSets } from "../../data/stations";
import { useTripUpdates } from "../../hooks/useTripUpdates";
import { useVehiclePositions } from "../../hooks/useVehiclePositions";
import { Station } from "../../models/station";
import { Train } from "./train";
import { ReactElement } from "react";

export const Ladder = (): ReactElement => {
  const vehiclePositions = useVehiclePositions();
  const tripUpdates = useTripUpdates();
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
          <TrainsAndStations stations={StationSets.AlewifeAndrew} />
          <TrainsAndStations stations={StationSets.JFKAshmont} />
          <TrainsAndStations stations={StationSets.JFKBraintree} />
          <div className="absolute top-[284px] left-[344px]">
            <Train
              route="Red-Braintree"
              label="1888"
              direction={0}
              highlight={true}
            />
          </div>
          <div className="absolute top-[316px] left-[1024px]">
            <Train route="Red-Ashmont" label="1889" direction={1} />
          </div>
        </div>
      </div>
    </>
  );
};

// TODO: accept VehiclePositions and use them to determine the <Train />'s to render
const TrainsAndStations = ({
  stations,
  // vps
}: {
  stations: Station[];
  // vps: VehiclePosition[]
}): ReactElement => {
  return (
    <div className="relative flex">
      <StationList stations={stations} />
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
