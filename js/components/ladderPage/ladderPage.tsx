/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import { RouteId } from "../../models/common";
import { trackSideBarOpened } from "../../telemetry/trackingEvents";
import { className } from "../../util/dom";
import { Ladders } from "./ladder";
import { SideBar, SideBarSelection } from "./sidebar";
import { ReactElement, useCallback, useEffect, useState } from "react";

export const LadderPage = ({ routeId }: { routeId: RouteId }): ReactElement => {
  const [sideBarSelection, setSideBarSelection] =
    useState<SideBarSelection | null>(null);

  const openSideBar = useCallback(
    (selection: SideBarSelection | null) => {
      if (selection !== null) {
        trackSideBarOpened(selection);
      }
      setSideBarSelection(selection);
    },
    [setSideBarSelection],
  );

  const close = useCallback(() => {
    setSideBarSelection(null);
  }, [setSideBarSelection]);

  // Close sidebar on escape key
  const onEscape = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
      }
    },
    [close],
  );

  useEffect(() => {
    document.addEventListener("keydown", onEscape, false);

    return () => {
      document.removeEventListener("keydown", onEscape, false);
    };
  }, [onEscape]);

  return (
    <main className="flex h-screen justify-center">
      <div
        className={className([
          "flex overflow-auto transition-all duration-300 ease-in-out w-full",
          sideBarSelection && "ml-80 min-[1485px]:ml-0",
        ])}
        // Close sidebar when clicking anywhere in the background
        onClick={close}
      >
        <Ladders
          routeId={routeId}
          setSideBarSelection={openSideBar}
          sideBarSelection={sideBarSelection}
        />
      </div>
      {sideBarSelection !== null ?
        <SideBar selection={sideBarSelection} close={close} />
      : null}
    </main>
  );
};
