import { className } from "../../util/dom";
import { ReactElement } from "react";

export const Train = ({
  route,
  label,
  highlight,
  direction,
  className: extraClassName,
}: {
  route: "Red-Ashmont" | "Red-Braintree";
  label: string;
  highlight?: boolean;
  direction: number;
  className?: string;
}): ReactElement => {
  const bgColor = route === "Red-Braintree" ? "bg-crimson" : "bg-tangerine";
  const orientation = direction == 0 ? "right-0" : "left-0";
  return (
    <div className="relative">
      <div
        className={className([
          "m-1 relative flex items-center justify-center rounded-3xl w-24 h-10 font-semibold",
          highlight ? "border-[3px] animate-pulse" : "border",
          route === "Red-Braintree" ? "border-crimson"
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
          : route === "Red-Ashmont" ? "border-tangerine"
          : "",
          extraClassName,
        ])}
      >
        {/* line that connects to ladder */}
        <div
          className={className([
            "absolute top-1/2 w-5 h-1.5 transform -translate-y-1/2",
            direction == 0 ? "translate-x-full" : "-translate-x-full",
            bgColor,
            orientation,
          ])}
        />
        {/* dot attached to the ladder */}
        {/* TODO: add semi-transparent border */}
        <div
          className={className([
            "absolute rounded-full h-[16px] w-[16px]",
            direction == 0 ?
              highlight ? "translate-x-[calc(100%+18px)]"
              : "translate-x-[calc(100%+16px)]"
            : highlight ? "-translate-x-[calc(100%+18px)]"
            : "-translate-x-[calc(100%+16px)]",
            bgColor,
            orientation,
          ])}
        />
        {label}
      </div>
    </div>
  );
};
