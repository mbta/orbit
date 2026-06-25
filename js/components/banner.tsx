import { useDataWarnings } from "../contexts/dataWarningsContext";
import { className } from "../util/dom";
import { ReactElement } from "react";

export const Banner = (): ReactElement => {
  const [warnings] = useDataWarnings();

  return warnings.size > 0 ?
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
            {[...warnings].map((warning) => {
              if (warning === "vehicle_positions_stale") {
                return <li key={warning}>Train positions out of date</li>;
              }
              return <></>;
            })}
          </ul>
        </div>
      </div>
    : <></>;
};
