import { DirectionalStopIds } from "../../data/stations";
import {
  ORBIT_HR_STAKEHOLDERS,
  ORBIT_RL_TRAINSTARTERS,
  ORBIT_TID_STAFF,
  userHasOneOf,
} from "../../groups";
import { DirectionId } from "../../models/common";
import { Vehicle } from "../../models/vehicle";
import { remapLabel } from "../../util/consist";
import { className } from "../../util/dom";
import { vehicleHeightDiff } from "./height";
import { VehicleWithHeight } from "./ladder";
import { SideBarSelection } from "./sidebar";
import { TrainTheme } from "./trainTheme";
import { ReactElement } from "react";

/**
 * Takes in a sorted array of vehiclesWithHeight (asc) and processes
 * every vehicle, comparing 2 at a time. If there is a pill height overlap
 * between the current pair, then the "next" vehicle has its labelOffset adjusted
 */
const adjustLabelOffsets = (
  vehiclesWithHeights: VehicleWithHeight[],
  directionId: DirectionId,
): VehicleWithHeight[] => {
  // A sorted array (by height asc) works well for processing Northbound vehicles because
  // vehicles with greater height values (css "top" styling) are positioned further down
  // from the top (and are towards the end of the array), vice versa for smaller heights.
  // When traveling southbound, vehicles at the end of the sorted array are actually further
  // "ahead" down the ladder than vehicles above it. To reuse the same logic
  // between northbound & southbound, we reverse southbound arrays for processing.
  const vehicles =
    directionId === 1 ? vehiclesWithHeights : (
      [...vehiclesWithHeights].reverse()
    );

  const processedVehicles = [];
  let curr = vehicles[0];
  let next: VehicleWithHeight;
  for (let i = 1; i < vehicles.length; i += 1) {
    next = vehicles[i];
    const heightDiff =
      directionId === 1 ?
        vehicleHeightDiff(curr, next, directionId)
      : vehicleHeightDiff(next, curr, directionId);

    if (heightDiff !== null && heightDiff < 40) {
      // use timestamp as tiebreaker for vehicles at the same station.
      // if curr arrived before next, don't modify as the algorithm will work as normal
      if (heightDiff === 0) {
        const currTimestamp = curr.vehicle.vehiclePosition.timestamp;
        const nextTimestamp = next.vehicle.vehiclePosition.timestamp;
        if (currTimestamp && nextTimestamp && nextTimestamp < currTimestamp) {
          const temp = next;
          next = curr;
          curr = temp;
        }
      }
      // add +2 to the offset to provide a little space between pills
      next.heights.labelOffset = 40 - heightDiff + 2;
    }
    processedVehicles.push(curr);
    curr = next;
  }
  processedVehicles.push(curr);
  return processedVehicles;
};

export const avoidLabelOverlaps = (
  sortedVehiclesByHeight: VehicleWithHeight[],
): VehicleWithHeight[] => {
  const southboundVehicles: VehicleWithHeight[] = [];
  const northboundVehicles: VehicleWithHeight[] = [];

  /* Categorize vehicles by direction. 
  When a train reaches a station with specific track stopIds (ex: Alewife or Braintree)
  the updated directionId from RTR may not match which side of the ladder branch we expect it to be on,
  which breaks the pattern of comparing trains that share the same directionId. Check for that here */
  for (const vH of sortedVehiclesByHeight) {
    const vp = vH.vehicle.vehiclePosition;
    if (vp.stopId && DirectionalStopIds.has(vp.stopId)) {
      if (DirectionalStopIds.get(vp.stopId) === 1) {
        northboundVehicles.push(vH);
      } else {
        southboundVehicles.push(vH);
      }
    } else {
      if (vH.vehicle.vehiclePosition.directionId === 0) {
        southboundVehicles.push(vH);
      } else {
        northboundVehicles.push(vH);
      }
    }
  }

  return (
    southboundVehicles.length > 1 ?
      adjustLabelOffsets(southboundVehicles, 0)
    : southboundVehicles).concat(
    northboundVehicles.length > 1 ?
      adjustLabelOffsets(northboundVehicles, 1)
    : northboundVehicles,
  );
};

export const Train = ({
  theme,
  vehicle,
  forceDirection,
  labelOffset,
  highlight,
  className: extraClassName,
  setSideBarSelection,
}: {
  theme: TrainTheme;
  vehicle: Vehicle;
  forceDirection: DirectionId;
  labelOffset: number | null;
  highlight?: boolean;
  className?: string;
  setSideBarSelection: (selection: SideBarSelection | null) => void;
}): ReactElement => {
  const orientation = forceDirection == 0 ? "right-0" : "left-0";
  const label = vehicle.vehiclePosition.label;
  const displayLabel = remapLabel(label, vehicle.vehiclePosition.routeId);
  return (
    <div className="relative">
      {/* line that connects to dot */}
      {/* the bounding box is determined by the pill button. the svg element must be transformed such that its
      dimensions covers the area between the dot and the pill in order to render the line that connects them */}
      <svg
        className={className([
          "absolute w-20 transform top-[calc(50%-4px)]",
          forceDirection === 1 ?
            "-translate-x-[17.6px]"
          : "-scale-y-100 -scale-x-100 translate-x-[17.6px] -translate-y-[calc(100%-7px)]",
          orientation,
        ])}
        style={{ height: `${labelOffset !== null ? labelOffset + 8 : 8}px` }}
      >
        {/* to render the connecting line between dots and any offsetted pills, we simply utilize x, y coordinates on the line
        and angle them "downwards." For southbound trains we mirror (flip) them on their x and y axes and then transform them 
        into position in order to achieve "upward" angles */}
        <line
          data-testid="dot-pill-connector-line"
          className={className(["translate-y-1", theme.strokeColor])}
          x1={0}
          y1={0}
          x2={30}
          y2={labelOffset ?? 0}
          strokeWidth="6px"
        />
      </svg>

      {/* train label */}
      <button
        className={className([
          "pointer-events-auto m-1 relative items-center justify-center rounded-3xl w-24 h-10 font-semibold bg-white",
          highlight ? "border-[3px] animate-pulse" : "border",
          theme.borderColor,
          extraClassName,
        ])}
        style={{
          top: `${
            labelOffset ?
              forceDirection === 0 ?
                labelOffset * -1
              : labelOffset
            : 0
          }px`,
        }}
        onClick={(e) => {
          e.stopPropagation();
          const sideBarSelection: SideBarSelection = {
            vehicle,
          };
          setSideBarSelection(sideBarSelection);
        }}
        disabled={
          !userHasOneOf([
            ORBIT_HR_STAKEHOLDERS,
            ORBIT_RL_TRAINSTARTERS,
            ORBIT_TID_STAFF,
          ])
        }
      >
        {displayLabel}
      </button>

      {/* dot that attaches to ladder */}
      {/* semi-transparent border */}
      <div
        className={className([
          "absolute rounded-full h-[32px] w-[32px] border-8 border-opacity-35 top-2 z-1",
          theme.borderColor,
          forceDirection == 0 ?
            highlight ? "translate-x-[calc(100%+3px)]"
            : "translate-x-[calc(100%+3px)]"
          : highlight ? "-translate-x-[calc(100%+3px)]"
          : "-translate-x-[calc(100%+3px)]",
          orientation,
        ])}
      >
        {/* actual dot */}
        <div
          className={className([
            "absolute rounded-full h-[16px] w-[16px]",
            theme.backgroundColor,
          ])}
        />
      </div>
    </div>
  );
};
