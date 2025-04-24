import { Station } from "../../models/station";
import { className } from "../../util/dom";
import { ReactElement } from "react";

export const Ladder = ({ stations }: { stations: Station[] }): ReactElement => {
  return <StationList stations={stations} />;
};

const StationList = ({ stations }: { stations: Station[] }): ReactElement => {
  return (
    <div className="relative mt-20 mb-20">
      <ul className="relative mx-auto w-32 border-x-[6px] border-solid border-gray-300">
        <li className="pt-12" />

        {/* triangle on top right */}
        <div className="absolute right-[-18px] top-0 w-0 h-0 border-l-[15px] border-l-white border-r-[15px] border-r-white border-b-[25px] border-b-gray-300"></div>
        {/* triangle on bottom left */}
        <div className="absolute bottom-0 left-[-18px] w-0 h-0 border-l-[15px] border-l-white border-r-[15px] border-r-white border-t-[25px] border-t-gray-300"></div>

        {stations.map((station) => {
          return (
            <li
              key={station.id}
              className={className([
                "relative",
                "text-center",
                station.spacing == 28 ? "mb-28"
                : station.spacing == 20 ? "mb-20"
                : station.spacing == 14 ? "mb-14"
                : station.spacing == 12 ? "mb-12"
                : station.spacing == 11 ? "mb-11"
                : station.spacing == 10 ? "mb-10"
                : station.spacing == 8 ? "mb-8"
                : "",
              ])}
            >
              {/* station dots on left and right */}
              <div className="absolute bg-white mt-0.5 left-[-13px] size-5 rounded-full border-4 border-gray-300" />
              <div className="absolute bg-white mt-0.5 right-[-13px] size-5 rounded-full border-4 border-gray-300" />
              {station.name}
            </li>
          );
        })}
        <li className="pb-12" />
      </ul>
    </div>
  );
};
