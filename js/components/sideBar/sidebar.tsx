import { CarId } from "../../models/common";
import { ReactElement } from "react";

export type SideBarSelection = {
  consist: CarId[];
};

export const SideBar = ({
  selection: { consist },
  close,
}: {
  selection: SideBarSelection;
  close: () => void;
}): ReactElement => {
  return (
    <div className="fixed left-0 w-80 h-screen bg-gray-200">

      <button
        className="absolute m-3 top-0 right-0 h-4 w-4 hover:fill-slate-700"
        onClick={close}
      >
        <img src="/images/close.svg" alt="close sidebar" />
      </button>

      <div className="mt-14 px-4">{consist}</div>
    </div>
  );
};
