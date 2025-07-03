import { CarId } from "../../models/common";
import { Vehicle } from "../../models/vehicle";
import { reorder } from "../../util/consist";
import { className } from "../../util/dom";
import { ReactElement, useRef } from "react";

export type SideBarSelection = {
  vehicle: Vehicle;
};

export const SideBar = ({
  selection,
  close,
}: {
  selection: SideBarSelection | null;
  close: () => void;
}): ReactElement => {
  const consist: CarId[] =
    selection ?
      reorder(
        selection.vehicle.vehiclePosition.label,
        selection.vehicle.vehiclePosition.cars,
        selection.vehicle.vehiclePosition.directionId,
      )
    : [""];

  const leadCarIndex =
    selection &&
    (selection.vehicle.vehiclePosition.directionId === 0 ?
      0
    : selection.vehicle.vehiclePosition.cars.length - 1);

  const ref = useRef(null);
  return (
    <aside
      ref={ref}
      className={className([
        "fixed flex-grow left-0 top-12 w-full sm:w-80 h-dvh bg-gray-100 transition-transform duration-300 ease-in-out",
        selection ? "animate-slide-in-from-left" : null,
      ])}
    >
      <button
        className="absolute m-3 top-0 right-0 h-4 w-4 hover:fill-slate-700"
        onClick={close}
      >
        <img src="/images/close.svg" alt="Close" />
      </button>
      <div className="mt-14 px-4 flex">
        {consist.map((label, index) => (
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
      <CurrentTrip />
    </aside>
  );
};

const CurrentTrip = () => {
  return (
    <section className="m-5 pt-5 border-t border-gray-300">
      <h2 className="text-lg font-semibold uppercase">Current Trip</h2>
      <div className="flex justify-between mt-3">
        <div className="flex flex-col justify-between">
          <span className="text-gray-300">Departure</span>
          <span>---</span>
          <span className="text-gray-300 mt-5">Arrival</span>
          <span>---</span>
        </div>
        <div className="flex flex-col justify-between">
          <span className="text-gray-300">Scheduled</span>
          <span className="font-bold">--- (N/A)</span>
          <span className="text-gray-300 mt-5">Scheduled</span>
          <span className="font-bold">---</span>
        </div>
        <div className="flex flex-col justify-between">
          <span className="text-gray-300">Actual</span>
          <span className="font-bold">---</span>
          <span className="text-gray-300 mt-5">Estimated</span>
          <span className="font-bold">---</span>
        </div>
      </div>
    </section>
  );
};
