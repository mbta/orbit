import { formatStationName } from "../../data/stations";
import { dateTimeFormat } from "../../dateTime";
import { CarId } from "../../models/common";
import { estimatedArrival } from "../../models/tripUpdate";
import {
  lateArrival,
  lateDeparture,
  lateForNext,
  Vehicle,
} from "../../models/vehicle";
import { remapLabels, reorder } from "../../util/consist";
import { className } from "../../util/dom";
import { ReactElement } from "react";

export type SideBarSelection = {
  vehicle: Vehicle;
};

export const SideBar = ({
  selection,
  close,
}: {
  selection: SideBarSelection;
  close: () => void;
}): ReactElement => {
  const vp = selection.vehicle.vehiclePosition;
  const consist: CarId[] = reorder(vp.label, vp.cars, vp.directionId);
  const processedConsist = remapLabels(consist, vp.routeId);
  const leadCarIndex = vp.directionId === 0 ? 0 : vp.cars.length - 1;
  return (
    <aside className="fixed flex-grow left-0 top-12 w-full sm:w-80 h-dvh bg-gray-100 transition-transform duration-300 ease-in-out animate-slide-in-from-left">
      <button
        className="absolute m-3 top-0 right-0 h-4 w-4 hover:fill-slate-700"
        onClick={close}
      >
        <img src="/images/close.svg" alt="Close" />
      </button>
      <div className="mt-14 px-4 flex">
        {processedConsist.map((label, index) => (
          <div
            key={index}
            className={className([
              "mr-2",
              index === leadCarIndex ? "font-bold text-2xl" : "pt-1.5",
            ])}
          >
            {label}
          </div>
        ))}
      </div>
      <CurrentTrip vehicle={selection.vehicle} />
      <NextTrip vehicle={selection.vehicle} />
    </aside>
  );
};

const CurrentTrip = ({ vehicle }: { vehicle: Vehicle }) => {
  const current = vehicle.ocsTrips.current;
  const estArrival = estimatedArrival(vehicle.tripUpdate);

  const lateDepMin = lateDeparture(vehicle);
  const lateArrMin = lateArrival(vehicle);
  const showLateDep = lateDepMin !== null && Math.abs(lateDepMin) >= 5;
  const showLateArr = lateArrMin !== null && Math.abs(lateArrMin) >= 5;
  const showLateBox = showLateDep || showLateArr;

  return (
    <section className="m-5 pt-5 border-t border-gray-300">
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
          <span>{formatStationName(current?.originStation) ?? "---"}</span>
          <span className="text-gray-300 mt-5">Arrival</span>
          <span>{formatStationName(current?.destinationStation) ?? "---"}</span>
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
      <section className="m-5 pt-5 border-t border-gray-300">
        <h2 className="text-lg text-gray-300 font-semibold">
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
    <section className="m-5 pt-5 border-t border-gray-300">
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
          <span>{formatStationName(next?.originStation) ?? "---"}</span>
          <span className="text-gray-300 mt-5">Arrival</span>
          <span>{formatStationName(next?.destinationStation) ?? "---"}</span>
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
