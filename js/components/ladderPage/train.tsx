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
import { SideBarSelection } from "./sidebar";
import { TrainTheme } from "./trainTheme";
import { ReactElement } from "react";

export const Train = ({
  theme,
  vehicle,
  forceDirection,
  highlight,
  className: extraClassName,
  setSideBarSelection,
}: {
  theme: TrainTheme;
  vehicle: Vehicle;
  forceDirection: DirectionId;
  highlight?: boolean;
  className?: string;
  setSideBarSelection: (selection: SideBarSelection | null) => void;
}): ReactElement => {
  const orientation = forceDirection == 0 ? "right-0" : "left-0";
  const label = vehicle.vehiclePosition.label;
  const displayLabel = remapLabel(label, vehicle.vehiclePosition.routeId);
  return (
    <div className="relative">
      {/* train label */}
      <button
        className={className([
          "m-1 relative flex items-center justify-center rounded-3xl w-24 h-10 font-semibold",
          highlight ? "border-[3px] animate-pulse" : "border",
          theme.borderColor,
          extraClassName,
        ])}
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

        {/* line that connects to dot */}
        <div
          className={className([
            "absolute top-1/2 w-5 h-1.5 transform -translate-y-1/2",
            forceDirection == 0 ? "translate-x-full" : "-translate-x-full",
            theme.backgroundColor,
            orientation,
          ])}
        />

        {/* dot that attaches to ladder */}
        {/* semi-transparent border */}
        <div
          className={className([
            "absolute rounded-full h-[32px] w-[32px] border-8 border-opacity-35",
            theme.borderColor,
            forceDirection == 0 ?
              highlight ? "translate-x-[calc(100%+10px)]"
              : "translate-x-[calc(100%+8px)]"
            : highlight ? "-translate-x-[calc(100%+10px)]"
            : "-translate-x-[calc(100%+8px)]",
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
      </button>
    </div>
  );
};
