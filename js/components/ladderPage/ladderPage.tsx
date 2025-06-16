import { RouteId } from "../../models/common";
import { className } from "../../util/dom";
import { SideBar, SideBarSelection } from "../sideBar/sidebar";
import { Ladders } from "./ladder";
import { ReactElement, useState } from "react";

export const LadderPage = ({ routeId }: { routeId: RouteId }): ReactElement => {
  const [sideBarSelection, setSideBarSelection] =
    useState<SideBarSelection | null>(null);

  return (
    <div className="relative flex h-screen items-center justify-center">
      <div
        className={className([
          "overflow-x-hidden mt-72",
          sideBarSelection ? "translate-x-80" : "translate-x-0",
        ])}
      >
        <Ladders routeId={routeId} setSideBarSelection={setSideBarSelection} />
      </div>
      <SideBar
        selection={sideBarSelection ?? null}
        close={() => {
          setSideBarSelection(null);
        }}
      />
    </div>
  );
};
