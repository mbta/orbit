import { Station } from "../../models/station";
import { ReactElement } from "react";

export const Ladder = ({ stations }: { stations: Station[] }): ReactElement => {
  return <StationList stations={stations} />;
};

const StationList = ({ stations }: { stations: Station[] }): ReactElement => {
  return (
    <ul className="w-32 border-0 border-solid">
      {stations.map((station) => {
        return (
          <li key={station.id} className={station.spacing.toString()}>
            {station.name}
          </li>
        );
      })}
    </ul>
  );
};
