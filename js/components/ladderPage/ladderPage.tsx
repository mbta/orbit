import { RouteId } from "../../models/common";
import { SideBar, SideBarSelection } from "../sideBar/sidebar";
import { Ladders } from "./ladder";
import { ReactElement, useState } from "react";

export const LadderPage = ({ routeId }: { routeId: RouteId }): ReactElement => {
  const [sideBarSelection, setSideBarSelection] =
    useState<SideBarSelection | null>(null);

  console.log(sideBarSelection);
  return (
    <div className="relative h-screen flex items-center justify-center">
      {sideBarSelection ?
        <SideBar
          selection={sideBarSelection}
          close={() => {
            setSideBarSelection(null);
          }}
        />
      : null}
      <Ladders routeId={routeId} setSideBarSelection={setSideBarSelection} />
    </div>
  );
};
