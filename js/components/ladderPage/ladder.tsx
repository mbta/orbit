import { StationSets } from "../../data/stations";
import { useVehiclePositions } from "../../hooks/useVehiclePositions";
import { Station } from "../../models/station";
import { className } from "../../util/dom";
import { ReactElement } from "react";

export const Ladder = (): ReactElement => {
  const vehiclePositions = useVehiclePositions();
  return (
    <>
      <div className="flex justify-center">
        <StationList stations={StationSets.AlewifeAndrew} />
        <StationList stations={StationSets.JFKAshmont} />
        <StationList stations={StationSets.JFKBraintree} />
      </div>
      <div>Vehicle positions: {vehiclePositions}</div>
    </>
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
          return (
            <li
              key={station.id}
              className={className([
                station.marginBottom ?? "",
                station.extraStyling ?? "",
              ])}
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
