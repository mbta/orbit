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
import { VehicleWithHeight } from "./ladder";
import { SideBarSelection } from "./sidebar";
import { TrainTheme } from "./trainTheme";
import { ReactElement } from "react";

export const avoidLabelOverlaps = (
  sortedVehiclesByHeight: VehicleWithHeight[],
): VehicleWithHeight[] => {
  const processedSouthbound: VehicleWithHeight[] = [];
  const processedNorthbound: VehicleWithHeight[] = [];
  const southboundVehicles: VehicleWithHeight[] = [];
  const northboundboundVehicles: VehicleWithHeight[] = [];

  /* sometimes when a train reaches Alewife or Braintree (and is assigned to a specific track)
  the updated directionId from RTR may not match which side of the ladder branch we expect it to be on, 
  which breaks the pattern of comparing trains that share the same directionId */
  for (const vH of sortedVehiclesByHeight) {
    const vp = vH.vehicle.vehiclePosition;
    if (vp.stopId === "Alewife-01" || vp.stopId === "Braintree-01") {
      northboundboundVehicles.push(vH);
    } else if (vp.stopId === "Alewife-02" || vp.stopId === "Braintree-02") {
      southboundVehicles.push(vH);
    } else {
      if (vH.vehicle.vehiclePosition.directionId === 0) {
        southboundVehicles.push(vH);
      } else {
        northboundboundVehicles.push(vH);
      }
    }
  }

  if (northboundboundVehicles.length > 1) {
    let above = northboundboundVehicles[0];
    let below: VehicleWithHeight;
    for (let i = 1; i < northboundboundVehicles.length; i += 1) {
      below = northboundboundVehicles[i];

      // TODO: refactor into calculateHeightDiff()
      // "above" gets priority for northbound direction
      const aboveHeight =
        above.heights.labelHeight && above.heights.dotHeight ?
          above.heights.labelHeight + above.heights.dotHeight
        : (above.heights.dotHeight ?? null);

      const belowHeight =
        below.heights.labelHeight && below.heights.dotHeight ?
          below.heights.labelHeight + below.heights.dotHeight
        : (below.heights.dotHeight ?? null);

      // remember that in css styling, greater height values means "further down from the top"
      const heightDiff =
        aboveHeight && belowHeight && belowHeight - aboveHeight;

      if (heightDiff && heightDiff < 40) {
        // add +2 to provide some buffer space between the labels
        below.heights.labelHeight = 40 - heightDiff + 2;
      }
      processedNorthbound.push(above);
      above = below;
    }
    processedNorthbound.push(above);
  } else {
    processedNorthbound.concat(northboundboundVehicles);
  }

  if (southboundVehicles.length > 1) {
    // start from the "back" of the array in asc order by height
    // "below" get's priority for southbound direction
    let below = southboundVehicles[southboundVehicles.length - 1];
    let above: VehicleWithHeight;
    // eslint-disable-next-line better-mutation/no-mutation
    for (let i = southboundVehicles.length - 1; i > 0; i -= 1) {
      above = southboundVehicles[i - 1];

      const belowHeight =
        below.heights.labelHeight && below.heights.dotHeight ?
          below.heights.labelHeight + below.heights.dotHeight
        : (below.heights.dotHeight ?? null);

      const aboveHeight =
        above.heights.labelHeight && above.heights.dotHeight ?
          above.heights.labelHeight + above.heights.dotHeight
        : (above.heights.dotHeight ?? null);

      const heightDiff =
        aboveHeight && belowHeight && belowHeight - aboveHeight;

      if (heightDiff && heightDiff < 40) {
        // add +2 to provide some buffer space between the labels
        above.heights.labelHeight = 40 - heightDiff + 2;
      }
      processedSouthbound.push(below);
      below = above;
    }
    processedSouthbound.push(below);
  } else {
    processedSouthbound.concat(southboundVehicles);
  }

  return processedSouthbound.concat(processedNorthbound);
};

export const Train = ({
  theme,
  vehicle,
  forceDirection,
  labelHeight,
  highlight,
  className: extraClassName,
  setSideBarSelection,
}: {
  theme: TrainTheme;
  vehicle: Vehicle;
  forceDirection: DirectionId;
  labelHeight: number | null;
  highlight?: boolean;
  className?: string;
  setSideBarSelection: (selection: SideBarSelection | null) => void;
}): ReactElement => {
  const orientation = forceDirection == 0 ? "right-0" : "left-0";
  const label = vehicle.vehiclePosition.label;
  const displayLabel = remapLabel(label, vehicle.vehiclePosition.routeId);
  return (
    <div className="relative flex">
      {/* train label */}
      <button
        className={className([
          "m-1 relative flex items-center justify-center rounded-3xl w-24 h-10 font-semibold",
          highlight ? "border-[3px] animate-pulse" : "border",
          theme.borderColor,
          extraClassName,
        ])}
        style={{
          top: `${
            labelHeight ?
              forceDirection === 0 ?
                labelHeight * -1
              : labelHeight
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

      <div>
        {/* TODO: add svg rendering at angle */}
        {/* line that connects to dot */}
        <div
          className={className([
            "absolute top-1/2 w-5 h-1.5 transform -translate-y-1/2",
            forceDirection == 0 ?
              "translate-x-[calc(100%-5px)]"
            : "-translate-x-[calc(100%-5px)]",
            theme.backgroundColor,
            orientation,
          ])}
        />

        {/* dot that attaches to ladder */}
        {/* semi-transparent border */}
        <div
          className={className([
            "absolute rounded-full h-[32px] w-[32px] border-8 border-opacity-35 top-2",
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
    </div>
  );
};
