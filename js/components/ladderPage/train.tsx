import { TrainRoutePattern } from "../../models/trainRoutePattern";
import { className } from "../../util/dom";
import { ReactElement } from "react";

export const Train = ({
  routePattern,
  label,
  highlight,
  direction,
  className: extraClassName,
}: {
  routePattern: TrainRoutePattern;
  label: string;
  highlight?: boolean;
  direction: number;
  className?: string;
}): ReactElement => {
  const bgColor =
    routePattern === "Red-Braintree" ? "bg-crimson" : "bg-tangerine";
  const orientation = direction == 0 ? "right-0" : "left-0";
  return (
    <div className="relative">
      {/* train label */}
      <div
        className={className([
          "m-1 relative flex items-center justify-center rounded-3xl w-24 h-10 font-semibold",
          highlight ? "border-[3px] animate-pulse" : "border",
          routePattern === "Red-Braintree" ? "border-crimson"
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
          : routePattern === "Red-Ashmont" ? "border-tangerine"
          : "",
          extraClassName,
        ])}
      >
        {label}

        {/* line that connects to dot */}
        <div
          className={className([
            "absolute top-1/2 w-5 h-1.5 transform -translate-y-1/2",
            direction == 0 ? "translate-x-full" : "-translate-x-full",
            bgColor,
            orientation,
          ])}
        />

        {/* dot that attaches to ladder */}
        {/* semi-transparent border */}
        <div
          className={className([
            "absolute rounded-full h-[32px] w-[32px] border-8 border-opacity-35",
            routePattern == "Red-Braintree" ? "border-crimson" : (
              "border-tangerine"
            ),
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
              bgColor,
            ])}
          />
        </div>
      </div>
    </div>
  );
};
