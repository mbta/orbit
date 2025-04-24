import { Station } from "../../models/station";
import { className } from "../../util/dom";
import { ReactElement } from "react";

export const Ladder = ({ stations }: { stations: Station[] }): ReactElement => {
  return <StationList stations={stations} />;
};

const StationList = ({ stations }: { stations: Station[] }): ReactElement => {
  return (
    <ul className="mx-auto w-32 border-x-[6px] border-solid border-gray-400">
      {stations.map((station) => {
        return (
          <li
            key={station.id}
            className={className([
              "text-center",
              station.spacing == 28 ? "mb-28"
              : station.spacing == 20? "mb-20"
              : station.spacing == 14 ? "mb-14"
              : station.spacing == 12 ? "mb-12"
              : station.spacing == 11 ? "mb-11"
              : station.spacing == 10 ? "mb-10"
              : station.spacing == 8 ? "mb-8"
              : "",
            ])}
          >
            {station.name}
          </li>
        );
      })}
    </ul>
  );
};
