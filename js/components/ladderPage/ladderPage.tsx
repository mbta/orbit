import { RouteId } from "../../models/common";
import { className } from "../../util/dom";
import { Ladders } from "./ladder";
import { SideBar, SideBarSelection } from "./sidebar";
import { ReactElement, useState } from "react";

export const LadderPage = ({ routeId }: { routeId: RouteId }): ReactElement => {
  const [sideBarSelection, setSideBarSelection] =
    useState<SideBarSelection | null>(null);

  return (
    <main className="flex h-screen justify-center">
      <div
        className={className([
          "flex overflow-auto transition-all duration-300 ease-in-out w-full",
          sideBarSelection && "ml-80 min-[1485px]:ml-0",
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
    </main>
  );
};
