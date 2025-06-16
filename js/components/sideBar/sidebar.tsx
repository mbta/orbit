import { CarId } from "../../models/common";
import { className } from "../../util/dom";
import { ReactElement } from "react";

export type SideBarSelection = {
  consist: CarId[];
};

export const SideBar = ({
  selection,
  close,
}: {
  selection: SideBarSelection | null;
  close: () => void;
}): ReactElement => {
  return (
    <div
      className={className([
        "absolute w-80 h-screen bg-gray-200 transition-all duration-300 ease-in-out",
        selection ? "left-0" : "-left-[100%]",
      ])}
    >
      <button
        className="absolute m-3 top-0 right-0 h-4 w-4 hover:fill-slate-700"
        onClick={close}
      >
        <img src="/images/close.svg" alt="close sidebar" />
      </button>

      <div className="mt-14 px-4">{selection ? selection.consist : ""}</div>
    </div>
  );
};
