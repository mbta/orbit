import { formatStationName } from "../../data/stations";
import { dateTimeFormat } from "../../dateTime";
import { CarId } from "../../models/common";
import { Vehicle } from "../../models/vehicle";
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
    </aside>
  );
};

const CurrentTrip = ({ vehicle }: { vehicle: Vehicle }) => {
  const current = vehicle.ocsTrips.current;
  const tripUpdate = vehicle.tripUpdate;
  const stu =
    tripUpdate?.stopTimeUpdates[tripUpdate.stopTimeUpdates.length - 1];
  const estArrival = stu?.predictedArrivalTime;
  return (
    <section className="m-5 pt-5 border-t border-gray-300">
      <h2 className="text-lg font-semibold uppercase">Current Trip</h2>
      <div className="flex justify-between mt-3">
        <div className="flex flex-col justify-between">
          <span className="text-gray-300">Departure</span>
          <span>{formatStationName(current?.originStation) ?? "---"}</span>
          <span className="text-gray-300 mt-5">Arrival</span>
          <span>
            {formatStationName(current?.destinationStation) ?? "---"}
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
          <span className="font-bold">---</span>
          <span className="text-gray-300 mt-5">Estimated</span>
          <span className="font-bold">
            {estArrival ? dateTimeFormat(estArrival, "service") : "---"}
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
