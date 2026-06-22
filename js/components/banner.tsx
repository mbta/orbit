import { ReactElement } from "react";
import { useDataWarnings } from "../contexts/dataWarningsContext";
import { className } from "../util/dom";

export const Banner = (): ReactElement => {
    const { warnings, setWarnings } = useDataWarnings();

    return Array.from(Object.values(warnings)).reduce((previous, current) => previous && current) ? (
        <div
            className={className(["flex flex-col px-3 py-4 text-xs"])}
        >
            <div className="flex flex-row items-center gap-2">
                <img
                    src={`/images/info.svg`}
                    alt={""}
                    className={className(["h-3 w-3 inline"])}
                />
                <p className="font-semibold uppercase tracking-wide-4 light:text-slate-800 dark:text-white">
                    Data Issue
                </p>
            </div>
            <div className="ml-5 flex flex-1 flex-col light:text-slate-600 dark:text-slate-300">
                <ul className="list-inside list-disc">
                    {Object.entries(warnings).filter(([key, value]) => value).map(([key, value]) => {
                        if (key === "VEHICLE_POSITIONS_STALE") {
                           return <li key={key}>Train positions out of date</li>
                        }
                        return <></>
                    })}
                </ul>
            </div>
        </div>
    ) : <></>;
}