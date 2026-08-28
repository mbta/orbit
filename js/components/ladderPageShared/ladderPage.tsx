/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import { useVehicles } from "../../hooks/useVehicles";
import { RouteId } from "../../models/common";
import { Vehicle } from "../../models/vehicle";
import { trackSideBarOpened } from "../../telemetry/trackingEvents";
import { className } from "../../util/dom";
import { BranchPicker, BranchPickerSelection } from "./branchPicker";
import { Ladders } from "./ladder";
import { SearchBar, VehicleSearchMatch } from "./search";
import { SideBar, SideBarSelection } from "./sidebar";
import { ReactElement, useCallback, useEffect, useRef, useState } from "react";

// Without this: each render on L17 will create a new array, causing the useEffect on L49 to run every time
const NO_VEHICLES: Vehicle[] = [];

export const LadderPage = ({ routeId }: { routeId: RouteId }): ReactElement => {
  const vehicles = useVehicles() ?? NO_VEHICLES;
  const [sideBarSelection, setSideBarSelection] =
    useState<SideBarSelection | null>(null);
  const [branchPickerSelection, setBranchPickerSelection] =
    useState<BranchPickerSelection>("Ashmont");
  const [searchQuery, setSearchQuery] = useState("");
  const [isOverflowing, setIsOverflowing] = useState(false);
  const laddersRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const el = laddersRef.current;
    if (!el) return;
    const check = () => {
      setIsOverflowing(el.scrollWidth > el.clientWidth);
    };
    check();
    window.addEventListener("resize", check);
    return () => {
      window.removeEventListener("resize", check);
    };
  }, []);

  const onSearchMatch = useCallback(
    (match: VehicleSearchMatch): boolean => {
      openSideBar({ vehicle: match.vehicle, searchedCar: match.matchedCar });
      return true;
    },
    [openSideBar],
  );

  const onSearchCleared = useCallback(() => {
    setSideBarSelection((selection) => {
      if (selection?.searchedCar === undefined) {
        return selection;
      }

      return { vehicle: selection.vehicle };
    });
  }, [setSideBarSelection]);

  const onQueryChange = useCallback(
    (query: string) => {
      setSearchQuery(query);
      setSideBarSelection(null);
    },
    [setSearchQuery, setSideBarSelection],
  );

  const openSideBarFromLadder = useCallback(
    (selection: SideBarSelection | null) => {
      if (!selection?.vehicle.vehiclePosition.cars.includes(searchQuery)) {
        setSearchQuery("");
      }
      openSideBar(selection);
    },
    [openSideBar, setSearchQuery, searchQuery],
  );

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      <main className="bg-glides-blue-700 flex flex-1 min-h-0 overflow-y-auto overflow-x-hidden justify-center">
        {sideBarSelection !== null ?
          <SideBar selection={sideBarSelection} close={close} />
        : null}
        <div
          data-testid="scroll-container"
          className={className([
            "relative flex transition-all duration-300 ease-in-out overflow-x-auto snap-x snap-mandatory w-full",
          ])}
          // Close sidebar when clicking anywhere in the background
          onClick={close}
        >
          <SearchBar
            vehicles={vehicles}
            query={searchQuery}
            onSearchMatch={onSearchMatch}
            onSearchCleared={onSearchCleared}
            onQueryChange={onQueryChange}
          />
          <Ladders
            ref={laddersRef}
            routeId={routeId}
            vehicles={vehicles}
            setSideBarSelection={openSideBarFromLadder}
            setBranchPickerSelection={setBranchPickerSelection}
            sideBarSelection={sideBarSelection}
          />
        </div>
      </main>
      {isOverflowing && (
        <div className="flex justify-center w-full">
          <BranchPicker
            branchPickerSelection={branchPickerSelection}
            setBranchPickerSelection={setBranchPickerSelection}
          />
        </div>
      )}
    </div>
  );
};
