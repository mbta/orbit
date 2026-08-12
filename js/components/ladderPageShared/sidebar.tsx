import { formatStationName, gtfsIdToDisplayName } from "../../data/stations";
import { dateTimeFormat } from "../../dateTime";
import { CarId } from "../../models/common";
import { estimatedArrival } from "../../models/tripUpdate";
import {
  lateArrival,
  lateDeparture,
  lateForNext,
  latestOcsUpdatedAt,
  Vehicle,
} from "../../models/vehicle";
import { StopStatus } from "../../models/vehiclePosition";
import { getColorSchemeSetting } from "../../util/colorScheme";
import { remapLabels, reorder } from "../../util/consist";
import { className } from "../../util/dom";
import { isFeatureEnabled } from "../../util/featureFlags";
import { TrainTheme } from "./trainTheme";
import { DateTime } from "luxon";
import { ReactElement, useState } from "react";

export type SideBarSelection = {
  vehicle: Vehicle;
  theme: TrainTheme;
  searchedCar?: CarId | null;
};

export const SideBar = ({
  selection,
  close,
}: {
  selection: SideBarSelection;
  close: () => void;
}): ReactElement => {
  const colorScheme = getColorSchemeSetting();

  return (
    <aside className="sm:min-w-[320px] z-[20] sticky flex flex-col left-0 sm:w-80 light:bg-white light:text-black dark:bg-slate-800 dark:text-white transition-transform duration-300 ease-in-out animate-slide-in-from-left">
      <Banner vehicle={selection.vehicle} theme={selection.theme} />
      <button
        className="absolute m-3 pt-2 top-0 right-0 h-4 w-4 hover:fill-slate-700"
        onClick={close}
      >
        <img
          src="/images/close.svg"
          alt="Close"
          style={{
            filter: colorScheme === "light" ? "invert(0.4)" : "invert(1)",
          }}
        />
      </button>
      <div className="h-full w-screen sm:w-auto">
        <CurrentLocation vehicle={selection.vehicle} />
        <CurrentTrip vehicle={selection.vehicle} />
        <Consist
          vehicle={selection.vehicle}
          searchedCar={selection.searchedCar ?? null}
        />
        <NextTrip vehicle={selection.vehicle} />
        {isFeatureEnabled("ladder_sidebar_export") ?
          <VehicleCopyButton
            key={selection.vehicle.vehiclePosition.vehicleId}
            vehicle={selection.vehicle}
          />
        : null}
      </div>
      <LastOcsUpdated vehicle={selection.vehicle} />
    </aside>
  );
};

const processVehicleConsist = (
  vehicle: Vehicle,
): {
  consist: CarId[];
  processedConsist: CarId[];
  leadCarIndex: number;
} => {
  const vp = vehicle.vehiclePosition;
  const consist: CarId[] = reorder(vp.label, vp.cars, vp.directionId);
  const processedConsist = remapLabels(consist, vp.routeId);
  const leadCarIndex = vp.directionId === 0 ? 0 : vp.cars.length - 1;
  return { consist, processedConsist, leadCarIndex };
};

const Banner = ({
  vehicle,
  theme,
}: {
  vehicle: Vehicle;
  theme: TrainTheme;
}) => {
  const { processedConsist, leadCarIndex } = processVehicleConsist(vehicle);
  const current = vehicle.ocsTrips.current;
  return (
    <section className="pb-5 border-b border-gray-300">
      <div className={className([theme.backgroundColor, "h-2 w-full"])} />
      <div className="px-4 pt-2 text-md">
        <div className="flex items-center gap-2">
          <span
            className={className([
              "flex items-center justify-center w-6 h-6 rounded-full font-bold text-base light:text-white dark:text-slate-800",
              theme.backgroundColor,
            ])}
          >
            B
          </span>
          <div>{processedConsist[leadCarIndex]}</div>
        </div>
        <div>
          {current?.scheduledDeparture ?
            dateTimeFormat(current.scheduledDeparture, "service")
          : "---"}{" "}
          Sched
        </div>
      </div>
    </section>
  );
};

const Consist = ({
  vehicle,
  searchedCar,
}: {
  vehicle: Vehicle;
  searchedCar: CarId | null;
}) => {
  const { consist, processedConsist, leadCarIndex } =
    processVehicleConsist(vehicle);
  return (
    <section className="mt-7 flex flex-col gap-1.5">
      <div className="px-4 flex">
        {processedConsist.map((label, index) => {
          const isLeadCar = index === leadCarIndex;
          const isSearchMatch =
            searchedCar !== null && consist[index] === searchedCar;

          return (
            <div
              key={index}
              className={className([
                "mr-2",
                isLeadCar ? "font-bold text-2xl" : "pt-1.5",
                isSearchMatch ? "bg-[#ffdb00]" : "",
              ])}
            >
              {label}
            </div>
          );
        })}
      </div>
      <a
        href={`http://10.198.0.231/Train/sched_trip.php?train=${processedConsist[leadCarIndex]}`}
        className="hidden mt-2 px-1.5 py-3 md:flex flex-row items-center gap-1.5 border-black border max-w-fit mx-auto rounded-2xl"
      >
        <img src="/images/network.svg" alt="" className="h-4 w-4" />
        See Cars&rsquo; History
      </a>
    </section>
  );
};

const CurrentLocation = ({ vehicle }: { vehicle: Vehicle }) => {
  return (
    <section className="m-5 pt-5" data-testid="current-location-section">
      <h2 className="text-lg font-semibold uppercase">Current Location</h2>

      <div className="flex justify-between mt-3">
        <div className="flex justify-between">
          {vehicle.vehiclePosition.stopStatus === StopStatus.StoppedAt ?
            "Boarding at"
          : "Next stop"}
          &nbsp;
          <span className="font-bold">
            {gtfsIdToDisplayName(vehicle.vehiclePosition.stationId) ?? "---"}
          </span>
        </div>
      </div>
    </section>
  );
};
const StationDisplay = ({
  scheduled,
  updated,
}: {
  scheduled: string | null;
  updated?: string | null;
}) => {
  const scheduledFormatted = formatStationName(scheduled);
  const updatedFormatted = formatStationName(updated);
  return scheduledFormatted && updatedFormatted ?
      <span>
        <span className="line-through">{scheduledFormatted}</span>{" "}
        <span>{updatedFormatted}</span>
      </span>
    : <span>{scheduledFormatted ?? updatedFormatted ?? "---"}</span>;
};

const CurrentTrip = ({ vehicle }: { vehicle: Vehicle }) => {
  const current = vehicle.ocsTrips.current;

  const estArrival: DateTime | null = estimatedArrival(vehicle);

  const lateDepMin = lateDeparture(vehicle);
  // only calculate late arrival if using estimated arrival time
  const lateArrMin = estArrival !== null ? lateArrival(vehicle) : null;

  const showLateDep = lateDepMin !== null && Math.abs(lateDepMin) >= 5;
  const showLateArr = lateArrMin !== null && Math.abs(lateArrMin) >= 5;
  const showLateBox = showLateDep || showLateArr;

  return (
    <section className="m-5 pt-5">
      <h2 className="text-lg font-semibold uppercase">Current Trip</h2>
      {showLateBox && (
        <Late
          departedLate={showLateDep ? lateDepMin : null}
          arrivingLate={showLateArr ? lateArrMin : null}
          arrivingLateText={"scheduled."}
        />
      )}

      <div className="flex justify-between mt-3">
        <div className="flex flex-col justify-between">
          <span className="text-gray-300">Departure</span>
          <span>
            <StationDisplay
              scheduled={current?.originStation ?? null}
              updated={current?.originStationUpdated}
            />
          </span>
          <span className="text-gray-300 mt-5">Arrival</span>
          <span>
            <StationDisplay
              scheduled={current?.destinationStation ?? null}
              updated={current?.destinationStationUpdated}
            />
          </span>
        </div>
        <div className="flex flex-col justify-between">
          <span className="text-gray-300">Scheduled</span>
          <span className="font-bold">
            {current?.scheduledDeparture ?
              dateTimeFormat(current.scheduledDeparture, "service")
            : "---"}{" "}
            <Offset value={current?.offset} />
          </span>
          <span className="text-gray-300 mt-5">Scheduled</span>
          <span className="font-bold">
            {current?.scheduledArrival ?
              dateTimeFormat(current.scheduledArrival, "service")
            : "---"}{" "}
          </span>
        </div>
        <div className="flex flex-col justify-between">
          <span className="text-gray-300">Actual</span>
          <span className="font-bold">
            {current?.actualDeparture ?
              dateTimeFormat(current.actualDeparture, "service")
            : "---"}
          </span>
          <span className="text-gray-300 mt-5">Estimated</span>
          <span className="font-bold">
            {estArrival ? dateTimeFormat(estArrival, "service") : "---"}
          </span>
        </div>
      </div>
    </section>
  );
};

const NextTrip = ({ vehicle }: { vehicle: Vehicle }) => {
  const current = vehicle.ocsTrips.current;
  if (current && !current.nextUid) {
    // Explicitly, no next trip is assigned, so show "none"
    return (
      <section className="border-t border-gray-300">
        <h2 className="m-5 pt-5 text-lg text-gray-300 font-semibold">
          NEXT TRIP - none
        </h2>
      </section>
    );
  }

  const next =
    vehicle.ocsTrips.next.length === 0 ? null : vehicle.ocsTrips.next[0];

  const nextDepMin = lateForNext(vehicle);
  const showLateBox = nextDepMin !== null && nextDepMin >= 5;
  return (
    <section
      className="mt-5 border-t border-gray-300"
      data-testid="next-trip-section"
    >
      <div className="m-5">
        <h2 className="text-lg font-semibold uppercase">Next Trip</h2>
        {showLateBox && (
          <Late
            departedLate={null}
            arrivingLate={nextDepMin}
            arrivingLateText={"next trip's departure time."}
          />
        )}

        <div className="flex mt-3">
          <div className="flex flex-col justify-between">
            <span className="text-gray-300">Departure</span>
            {/* <span>{formatStationName(next?.originStation) ?? "---"}</span> */}
            <StationDisplay
              scheduled={next?.originStation ?? null}
              updated={next?.originStationUpdated}
            />
            <span className="text-gray-300 mt-5">Arrival</span>
            {/* <span>{formatStationName(next?.destinationStation) ?? "---"}</span> */}
            <StationDisplay
              scheduled={next?.destinationStation ?? null}
              updated={next?.destinationStationUpdated}
            />
          </div>
          <div className="flex flex-col ml-7">
            <span className="text-gray-300">Scheduled</span>
            <span className="font-bold">
              {next?.scheduledDeparture ?
                dateTimeFormat(next.scheduledDeparture, "service")
              : "---"}{" "}
              <Offset value={next?.offset} />
            </span>
            <span className="text-gray-300 mt-5">Scheduled</span>
            <span className="font-bold">
              {next?.scheduledArrival ?
                dateTimeFormat(next.scheduledArrival, "service")
              : "---"}{" "}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

const Offset = ({ value }: { value: number | null | undefined }) => {
  if (value === null || value == undefined || value === 0) {
    return null;
  }

  return "(" + (value > 0 ? `+${value}` : value.toString()) + ")";
};

const Late = ({
  departedLate,
  arrivingLate,
  arrivingLateText,
}: {
  departedLate: number | null;
  arrivingLate: number | null;
  arrivingLateText: string | null;
}) => {
  return (
    <div className="border-gray-300 bg-gray-200 rounded-lg text-black italic p-2 text-sm">
      <div className="flex">
        <div className="mt-0.5 mr-1">
          <img
            src={`/images/clock.svg`}
            // Per MDN re: alt text:
            // > If the image doesn't require a fallback (such as for an image which is decorative or an advisory icon
            //   of minimal importance), you may specify an empty string ("")
            alt={""}
            className={"w-4"}
          />
        </div>
        <div className="flex-1">
          {departedLate && (
            <p>
              Departed{" "}
              <span className="font-bold">
                {formatDelta(departedLate)} min{" "}
                {departedLate >= 0 ? "late" : "early"}
              </span>
              .
            </p>
          )}
          {arrivingLate && (
            <p>
              Arriving{" "}
              <span className="font-bold">
                {formatDelta(arrivingLate)} min{" "}
                {arrivingLate >= 0 ? "later" : "earlier"}
              </span>{" "}
              than {arrivingLateText}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

const formatDelta = (min: number) => {
  return Math.abs(Math.floor(min));
};

const VehicleCopyButton = ({ vehicle }: { vehicle: Vehicle }) => {
  const [copied, setCopied] = useState(false);
  const onCopy = (vehicle: Vehicle) => {
    const data = {
      copiedAt: new Date().toISOString(),
      vehicle,
    };
    const json = JSON.stringify(data, null, 4);
    // We use `void` operator here to explicitly ignore the result of the
    // writeText promise.
    void window.navigator.clipboard.writeText(json);
    setCopied(true);
  };

  return (
    <button
      className="absolute mb-6 mr-5 bottom-0 right-0 h-6 w-6 hover:fill-slate-700"
      title="Copy vehicle data (debug)"
      onClick={() => {
        onCopy(vehicle);
      }}
    >
      <img
        className="m-1 h-6 w-6 transition-opacity"
        src={
          copied ?
            "/images/clipboard-green-check.svg"
          : "/images/clipboard-gray.svg"
        }
        alt="Copy vehicle data (debug)"
      />
    </button>
  );
};

const LastOcsUpdated = ({ vehicle }: { vehicle: Vehicle }) => {
  const updatedAt = latestOcsUpdatedAt(vehicle);
  if (updatedAt !== null) {
    return (
      <div className="mb-6 ml-5">
        <span className="text-gray-400 text-xs italic">
          {`Last updated from OCS trainsheets at ${dateTimeFormat(updatedAt, "wall")}`}
        </span>
      </div>
    );
  }
  return null;
};
