import { useClickOutside } from "../../hooks/useClickOutside";
import { CarId, DirectionId } from "../../models/common";
import { reorder } from "../../util/consist";
import { className } from "../../util/dom";
import { ReactElement, useRef } from "react";

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
      reorder(selection.label, selection.consist, selection.direction)
    : [""];

  const leadCarIndex =
    selection && (selection.direction === 0 ? 0 : selection.consist.length - 1);

  const ref = useRef(null);
  useClickOutside([ref], () => {
    close();
  });
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
    </aside>
  );
};
