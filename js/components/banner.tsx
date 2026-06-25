import { useDataWarnings } from "../contexts/dataWarningsContext";
import { className } from "../util/dom";
import { ReactElement } from "react";

export const Banner = (): ReactElement => {
  const [warnings] = useDataWarnings();

  return (
      Array.from(Object.values(warnings)).reduce(
        (previous, current) => previous && current,
      )
    ) ?
      <div
        className={className(["flex flex-col px-3 py-4 text-xs bg-yellow/25"])}
      >
        <div className="flex flex-row items-center gap-2">
          <svg className={className(["h-3 w-3 inline fill-yellow"])}>
            <use xlinkHref={"/images/info.svg"} />
          </svg>
          <p className="font-semibold uppercase tracking-wide-4 text-slate-800">
            Data Issue
          </p>
        </div>
        <div className="ml-5 flex flex-1 flex-col text-slate-600">
          <ul className="list-inside list-disc">
            {Object.entries(warnings)
              .filter(([key, value]) => value)
              .map(([key, value]) => {
                if (key === "VEHICLE_POSITIONS_STALE") {
                  return <li key={key}>Train positions out of date</li>;
                }
                return <></>;
              })}
          </ul>
        </div>
      </div>
    : <></>;
};
