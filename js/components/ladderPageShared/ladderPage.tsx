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
  const mainRef = useRef<HTMLElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  // Start true so the initial centering also starts at the top of the page
  const resetVerticalScrollRef = useRef(true);
  const swipedSelectionRef = useRef<BranchPickerSelection | null>(null);
  const [branchPickerClick, setBranchPickerClick] = useState(0);

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
      // eslint-disable-next-line better-mutation/no-mutation
      resetVerticalScrollRef.current = true;
      setBranchPickerSelection(selection);
      // increment to signal we should scroll to top
      setBranchPickerClick((click) => click + 1);
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
    // Swiping already centered this branch; re-centering would jump vertically
    const fromSwipe = swipedSelectionRef.current === branchPickerSelection;
    // eslint-disable-next-line better-mutation/no-mutation
    swipedSelectionRef.current = null;
    if (fromSwipe && !resetVerticalScrollRef.current) return;
    const container = laddersRef.current;
    if (!container) return;
    const branch = container.querySelector<HTMLElement>(
      `[data-branch="${branchPickerSelection}"]`,
    );
    if (!branch) return;

    branch.scrollIntoView({
      behavior: "auto",
      inline: "center",
      block: resetVerticalScrollRef.current ? "start" : "nearest",
    });
    if (resetVerticalScrollRef.current) {
      [mainRef.current, scrollContainerRef.current, container].forEach(
        (scroller) => {
          if (scroller) {
            // eslint-disable-next-line better-mutation/no-mutation
            scroller.scrollTop = 0;
          }
        },
      );
      // eslint-disable-next-line better-mutation/no-mutation
      resetVerticalScrollRef.current = false;
    }
  }, [branchPickerSelection, branchPickerClick]);

  // Detect touch scroll and lock direction to starting axis by hiding overflow
  // on other axis
  useEffect(() => {
    const el = laddersRef.current;
    if (!el) return;
    let start: { x: number; y: number } | null = null;

    /* eslint-disable better-mutation/no-mutation */
    const unlock = () => {
      el.style.overflowX = "";
      el.style.overflowY = "";
    };
    const onTouchStart = ({ touches }: TouchEvent) => {
      unlock();
      start = { x: touches[0].clientX, y: touches[0].clientY };
    };
    const onTouchMove = ({ touches }: TouchEvent) => {
      if (!start) return;
      const dx = Math.abs(touches[0].clientX - start.x);
      const dy = Math.abs(touches[0].clientY - start.y);
      if (dx + dy <= 5) return;
      if (dx > dy) el.style.overflowY = "hidden";
      else el.style.overflowX = "hidden";
      start = null;
    };
    /* eslint-enable better-mutation/no-mutation */

    // Touches anywhere (e.g. the branch picker) end the previous lock
    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchmove", onTouchMove, { passive: true });
    el.addEventListener("scrollend", unlock);
    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("scrollend", unlock);
    };
  }, []);

  useEffect(() => {
    const container = laddersRef.current;
    if (!container) return;

    let timeout: ReturnType<typeof setTimeout>;

    const updateSelection = () => {
      const containerCenter =
        container.getBoundingClientRect().left +
        container.clientLeft +
        container.clientWidth / 2;

      const distanceFromCenter = (branch: HTMLElement) => {
        const { left, width } = branch.getBoundingClientRect();
        return Math.abs(left + width / 2 - containerCenter);
      };

      const branches = Array.from(
        container.querySelectorAll<HTMLElement>("[data-branch]"),
      );
      if (branches.length === 0) return;
      const [first] = branches;
      const last = branches[branches.length - 1];

      // At a scroll edge, the outer branch may be unable to reach the center
      // (e.g. when the ladders barely overflow), so select it explicitly
      const maxScrollLeft = container.scrollWidth - container.clientWidth;
      const centeredBranch =
        container.scrollLeft <= 1 ? first
        : container.scrollLeft >= maxScrollLeft - 1 ? last
        : branches.reduce(
            (closest, branch) =>
              distanceFromCenter(branch) < distanceFromCenter(closest) ?
                branch
              : closest,
            first,
          );

      const selection = Number(centeredBranch.dataset.branch);
      if (Number.isInteger(selection)) {
        // eslint-disable-next-line better-mutation/no-mutation
        swipedSelectionRef.current = selection;
        setBranchPickerSelection(selection);
      }
    };

    const onScroll = () => {
      clearTimeout(timeout);
      // eslint-disable-next-line better-mutation/no-mutation
      timeout = setTimeout(updateSelection, 120);
    };

    container.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      container.removeEventListener("scroll", onScroll);
      clearTimeout(timeout);
    };
  }, []);

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
      <main
        ref={mainRef}
        className="dark:bg-ladder-background-dark light:bg-ladder-background-light flex grow flex-1 min-h-0 overflow-y-auto overflow-x-hidden justify-center"
      >
        {sideBarSelection !== null && sideBarVehicle !== null ?
          <SideBar
            searchedCar={sideBarSelection.searchedCar}
            vehicle={sideBarVehicle}
            close={close}
          />
        : null}
        <div
          ref={scrollContainerRef}
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
          className="dark:bg-ladder-background-dark light:bg-ladder-background-light flex shrink-0 justify-center w-full"
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
