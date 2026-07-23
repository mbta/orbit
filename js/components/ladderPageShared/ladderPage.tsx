/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import { useVehicles } from "../../hooks/useVehicles";
import { RouteId } from "../../models/common";
import { trackSideBarOpened } from "../../telemetry/trackingEvents";
import { className } from "../../util/dom";
import { Ladders } from "./ladder";
import { SearchBar, VehicleSearchMatch } from "./search";
import { SideBar, SideBarSelection } from "./sidebar";
import { ReactElement, useCallback, useEffect, useState } from "react";

export const LadderPage = ({ routeId }: { routeId: RouteId }): ReactElement => {
  const vehicles = useVehicles() ?? [];
  const [sideBarSelection, setSideBarSelection] =
    useState<SideBarSelection | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

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
    setSearchQuery("");
  }, [setSideBarSelection, setSearchQuery]);

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

  const onSearchMatch = useCallback(
    (match: VehicleSearchMatch): boolean => {
      openSideBar({ vehicle: match.vehicle, searchedCar: match.matchedCar });
      return true;
    },
    [openSideBar],
  );

  const onSearchCleared = useCallback(() => {
    setSideBarSelection(null);
  }, [setSideBarSelection]);

  const openSideBarFromLadder = useCallback(
    (selection: SideBarSelection | null) => {
      const currentVehicleLabel =
        sideBarSelection?.vehicle.vehiclePosition.label;
      const newVehicleLabel = selection?.vehicle.vehiclePosition.label;

      const newPill =
        currentVehicleLabel !== undefined &&
        newVehicleLabel !== undefined &&
        currentVehicleLabel !== newVehicleLabel;

      if (newPill) {
        setSearchQuery("");
      }

      const nextSelection =
        (
          !newPill &&
          selection !== null &&
          selection.searchedCar === undefined &&
          sideBarSelection?.searchedCar !== undefined
        ) ?
          {
            ...selection,
            searchedCar: sideBarSelection.searchedCar,
          }
        : selection;

      openSideBar(nextSelection);
    },
    [openSideBar, setSearchQuery, sideBarSelection],
  );

  return (
    <main className="flex overflow-y-auto overflow-x-hidden justify-center">
      {sideBarSelection !== null ?
        <SideBar selection={sideBarSelection} close={close} />
      : null}
      <div
        className={className([
          "flex transition-all duration-300 ease-in-out overflow-x-auto w-full",
        ])}
        // Close sidebar when clicking anywhere in the background
        onClick={close}
      >
        <SearchBar
          vehicles={vehicles}
          query={searchQuery}
          setQuery={setSearchQuery}
          onSearchMatch={onSearchMatch}
          onSearchCleared={onSearchCleared}
        />
        <Ladders
          routeId={routeId}
          vehicles={vehicles}
          setSideBarSelection={openSideBarFromLadder}
          sideBarSelection={sideBarSelection}
        />
      </div>
    </main>
  );
};
