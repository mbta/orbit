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

  for (const vH of sortedVehiclesByHeight) {
    if (vH.vehicle.vehiclePosition.directionId === 0) {
      southboundVehicles.push(vH);
    } else {
      northboundboundVehicles.push(vH);
    }
  }

  if (northboundboundVehicles.length > 1) {
    // let i = 1;
    // let ahead = northboundboundVehicles[i - 1];
    let ahead = northboundboundVehicles[0];
    let behind: VehicleWithHeight;
    // while (i < northboundboundVehicles.length) {
    for (let i = 1; i < northboundboundVehicles.length; i += 1) {
      behind = northboundboundVehicles[i];

      // TODO: refactor into calculateHeightDiff()
      const aheadHeight =
        ahead.heights.labelHeight && ahead.heights.dotHeight ?
          ahead.heights.labelHeight + ahead.heights.dotHeight
        : (ahead.heights.dotHeight ?? null);

      const behindHeight =
        behind.heights.labelHeight && behind.heights.dotHeight ?
          behind.heights.labelHeight + behind.heights.dotHeight
        : (behind.heights.dotHeight ?? null);

      const heightDiff =
        aheadHeight && behindHeight && behindHeight - aheadHeight;

      if (heightDiff && heightDiff < 40) {
        console.log(
          `heightDiff < 40, ahead: ${aheadHeight}, behind: ${behindHeight}`,
        );
        // add +2 to provide some buffer space between the labels
        behind.heights.labelHeight = 40 - heightDiff + 2;
      }
      processedNorthbound.push(ahead);
      ahead = behind;
      // i += 1;
    }
    processedNorthbound.push(ahead);
  } else {
    processedNorthbound.concat(northboundboundVehicles);
  }

  if (southboundVehicles.length > 1) {
    // let i = southboundVehicles.length - 1;
    // let ahead = southboundVehicles[i];
    // start from the "back" of the array in asc order by height
    let ahead = southboundVehicles[southboundVehicles.length - 1];
    let behind: VehicleWithHeight;
    // while (i > 0) {
    for (let i = southboundVehicles.length - 1; i > 0; i -= 1) {
      behind = southboundVehicles[i - 1];

      const aheadHeight =
        ahead.heights.labelHeight && ahead.heights.dotHeight ?
          ahead.heights.labelHeight + ahead.heights.dotHeight
        : (ahead.heights.dotHeight ?? null);

      const behindHeight =
        behind.heights.labelHeight && behind.heights.dotHeight ?
          behind.heights.labelHeight + behind.heights.dotHeight
        : (behind.heights.dotHeight ?? null);

      const heightDiff =
        aheadHeight && behindHeight && aheadHeight - behindHeight;

      if (heightDiff && heightDiff < 40) {
        console.log(
          `heightDiff < 40, ahead: ${aheadHeight}, behind: ${behindHeight}`,
        );
        // add +2 to provide some buffer space between the labels
        behind.heights.labelHeight = 40 - heightDiff + 2;
      }
      processedSouthbound.push(ahead);
      ahead = behind;
      // i -= 1;
    }
    processedSouthbound.push(ahead);
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
            : ""
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
