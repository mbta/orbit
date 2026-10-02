/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import { useVehicles } from "../../hooks/useVehicles";
import { RouteId } from "../../models/common";
import { Vehicle } from "../../models/vehicle";
import { trackSideBarOpened } from "../../telemetry/trackingEvents";
import { className } from "../../util/dom";
import { BranchPicker, BranchPickerSelection } from "./branchPicker";
import { Ladders, SelectedVehicle } from "./ladder";
import { SearchBar, VehicleSearchMatch } from "./search";
import { SideBar } from "./sidebar";
import { ReactElement, useCallback, useEffect, useRef, useState } from "react";

// Without this: each render on L17 will create a new array, causing the useEffect on L49 to run every time
const NO_VEHICLES: Vehicle[] = [];

// Determine horitonzal scroll offset to center branch
export const centeredScrollLeft = (
  container: HTMLElement,
  branch: HTMLElement,
): number => {
  // how far specified branch is from left edge
  const branchOffset = branch.offsetLeft - container.offsetLeft;
  // where center of branch should be located in viewport
  const target =
    branchOffset + branch.offsetWidth / 2 - container.clientWidth / 2;
  // maxium available space to shift left
  // (zero if all ladders fit within visible area)
  const maxScrollLeft = Math.max(
    0,
    container.scrollWidth - container.clientWidth,
  );
  // number of pixels to scroll ladders container horizontally
  return Math.min(Math.max(target, 0), maxScrollLeft);
};

export const LadderPage = ({ routeId }: { routeId: RouteId }): ReactElement => {
  const vehicles = useVehicles() ?? NO_VEHICLES;
  const [sideBarSelection, setSideBarSelection] =
    useState<SelectedVehicle | null>(null);
  const [branchPickerSelection, setBranchPickerSelection] =
    useState<BranchPickerSelection>(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [resizeTimeout, setResizeTimeout] = useState<ReturnType<
    typeof setTimeout
  > | null>(null);
  const laddersRef = useRef<HTMLDivElement>(null);

  const findVehicle = useCallback(
    (vehicleId: string | null): Vehicle | null =>
      vehicles.find(
        (vehicle) => vehicle.vehiclePosition.vehicleId === vehicleId,
      ) ?? null,
    [vehicles],
  );

  const openSideBar = useCallback(
    (selection: SelectedVehicle | null) => {
      if (selection !== null) {
        const vehicle = findVehicle(selection.vehicleId);
        if (vehicle !== null) {
          trackSideBarOpened({ vehicle });
        }
      }
      setSideBarSelection(selection);
    },
    [findVehicle, setSideBarSelection],
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

  // Close sidebar on branch picker click
  const onBranchPickerSelection = useCallback(
    (selection: BranchPickerSelection) => {
      close();
      setBranchPickerSelection(selection);
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

    const onResize = () => {
      setResizeTimeout((currentTimeout) => {
        if (currentTimeout !== null) {
          clearTimeout(currentTimeout);
        }
        return setTimeout(check, 100);
      });
    };

    check();
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
    };
  }, [setResizeTimeout]);

  useEffect(() => {
    return () => {
      if (resizeTimeout !== null) {
        clearTimeout(resizeTimeout);
      }
    };
  }, [resizeTimeout]);

  // Center the selected branch's ladder whenever the selection changes
  useEffect(() => {
    const container = laddersRef.current;
    if (!container) return;
    const branch = container.querySelector<HTMLElement>(
      `[data-branch="${branchPickerSelection}"]`,
    );
    if (!branch) return;

    const left = centeredScrollLeft(container, branch);
    if (typeof container.scrollTo === "function") {
      container.scrollTo({ left, behavior: "auto" });
    } else {
      // eslint-disable-next-line better-mutation/no-mutation
      container.scrollLeft = left;
    }
  }, [branchPickerSelection]);

  const onSearchMatch = useCallback(
    (match: VehicleSearchMatch): boolean => {
      openSideBar({
        vehicleId: match.vehicle.vehiclePosition.vehicleId,
        searchedCar: match.matchedCar,
      });
      return true;
    },
    [openSideBar],
  );

  const onSearchCleared = useCallback(() => {
    setSideBarSelection((selection) => {
      if (selection?.searchedCar === undefined) {
        return selection;
      }

      return { vehicleId: selection.vehicleId };
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
    (selection: SelectedVehicle | null) => {
      const selectedVehicle =
        selection === null ? null : findVehicle(selection.vehicleId);
      if (!selectedVehicle?.vehiclePosition.cars.includes(searchQuery)) {
        setSearchQuery("");
      }
      openSideBar(selection);
    },
    [openSideBar, setSearchQuery, searchQuery, findVehicle],
  );

  const sideBarVehicle =
    sideBarSelection === null ? null : findVehicle(sideBarSelection.vehicleId);

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      <main className="dark:bg-ladder-background-dark light:bg-ladder-background-light flex grow flex-1 min-h-0 overflow-y-auto overflow-x-hidden justify-center">
        {sideBarSelection !== null && sideBarVehicle !== null ?
          <SideBar
            searchedCar={sideBarSelection.searchedCar}
            vehicle={sideBarVehicle}
            close={close}
          />
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
        <div
          className="dark:bg-ladder-background-dark light:bg-ladder-background-light flex justify-center w-full"
          data-testid="branch-picker-container"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              close();
            }
          }}
        >
          <BranchPicker
            route={routeId}
            selection={branchPickerSelection}
            setSelection={onBranchPickerSelection}
          />
        </div>
      )}
    </div>
  );
};
