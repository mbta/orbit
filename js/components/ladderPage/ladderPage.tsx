import { RouteId } from "../../models/common";
import { className } from "../../util/dom";
import { SideBar, SideBarSelection } from "../sideBar/sideBar";
import { Ladders } from "./ladder";
import { ReactElement, useState } from "react";

export const LadderPage = ({ routeId }: { routeId: RouteId }): ReactElement => {
  const SIDEBAR_WIDTH_PX = 320;
  const MIN_LADDERS_CONTENT_WIDTH_PX = 1248;

  const [sideBarSelection, setSideBarSelection] =
    useState<SideBarSelection | null>(null);

  return (
    <div className="relative flex h-screen items-center justify-center overflow-y-auto">
      <div
        className={className([
          "flex-grow overflow-x-hidden mt-72 transition-all duration-300 ease-in-out",
          (
            sideBarSelection &&
            window.innerWidth < MIN_LADDERS_CONTENT_WIDTH_PX + SIDEBAR_WIDTH_PX
          ) ?
            "ml-80"
          : "ml-0",
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
