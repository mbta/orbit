import { CarId } from "../../models/common";
import { className } from "../../util/dom";
import { SideBarSelection } from "../sideBar/sideBar";
import { TrainTheme } from "./trainTheme";
import { Dispatch, ReactElement, SetStateAction } from "react";

export const Train = ({
  theme,
  label,
  consist,
  highlight,
  direction,
  className: extraClassName,
  setSideBarSelection,
}: {
  theme: TrainTheme;
  label: string;
  consist: CarId[];
  highlight?: boolean;
  direction: number;
  className?: string;
  setSideBarSelection: Dispatch<SetStateAction<SideBarSelection | null>>;
}): ReactElement => {
  const orientation = direction == 0 ? "right-0" : "left-0";
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
        onClick={() => {
          const sideBarSelection: SideBarSelection = {
            consist: consist,
          };
          setSideBarSelection(sideBarSelection);
        }}
      >
        {label}

        {/* line that connects to dot */}
        <div
          className={className([
            "absolute top-1/2 w-5 h-1.5 transform -translate-y-1/2",
            direction == 0 ? "translate-x-full" : "-translate-x-full",
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
            direction == 0 ?
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
