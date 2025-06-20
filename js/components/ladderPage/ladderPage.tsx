import { RouteId } from "../../models/common";
import { className } from "../../util/dom";
import { SideBar, SideBarSelection } from "../sideBar/sideBar";
import { Ladders } from "./ladder";
import { ReactElement, useState } from "react";

export const LadderPage = ({ routeId }: { routeId: RouteId }): ReactElement => {
  const [sideBarSelection, setSideBarSelection] =
    useState<SideBarSelection | null>(null);

  return (
    <div className="relative flex h-screen items-center justify-center overflow-y-auto">
      <div
        className={className([
          "flex overflow-auto mt-72 transition-all duration-300 ease-in-out",
          sideBarSelection && "ml-80 2xl:ml-0",
        ])}
      >
        <Ladders routeId={routeId} setSideBarSelection={setSideBarSelection} />
      </div>
      {sideBarSelection ?
        <SideBar
          selection={sideBarSelection}
          close={() => {
            setSideBarSelection(null);
          }}
        />
      : null}
    </div>
  );
};
