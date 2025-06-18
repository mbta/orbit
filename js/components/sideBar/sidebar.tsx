import { CarId, DirectionId } from "../../models/common";
import { consistDirectionalOrder } from "../../util/consist";
import { className } from "../../util/dom";
import { ReactElement } from "react";

export type SideBarSelection = {
  label: CarId;
  consist: CarId[];
  direction: DirectionId;
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
      consistDirectionalOrder(
        selection.label,
        selection.consist,
        selection.direction,
      )
    : [""];

  const leadCarIndex =
    selection && (selection.direction === 0 ? 0 : selection.consist.length - 1);
  return (
    <div
      className={className([
        "absolute flex-grow left-0 w-80 h-dvh bg-gray-100 transition-transform duration-300 ease-in-out",
        selection ? "translate-x-0" : "-translate-x-full",
      ])}
    >
      <button
        className="absolute m-3 top-0 right-0 h-4 w-4 hover:fill-slate-700"
        onClick={close}
      >
        <img src="/images/close.svg" alt="close sidebar" />
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
    </div>
  );
};
