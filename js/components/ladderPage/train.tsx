import { className } from "../../util/dom";
import { TrainTheme } from "./trainTheme";
import { ReactElement } from "react";

export const Train = ({
  theme,
  label,
  highlight,
  direction,
  className: extraClassName,
}: {
  theme: TrainTheme;
  label: string;
  highlight?: boolean;
  direction: number;
  className?: string;
}): ReactElement => {
  const orientation = direction == 0 ? "right-0" : "left-0";
  return (
    <div className="relative">
      {/* train label */}
      <div
        className={className([
          "m-1 relative flex items-center justify-center rounded-3xl w-24 h-10 font-semibold",
          highlight ? "border-[3px] animate-pulse" : "border",
          theme.borderColor,
          extraClassName,
        ])}
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
      </div>
    </div>
  );
};
