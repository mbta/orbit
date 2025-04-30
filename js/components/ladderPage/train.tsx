import { className } from "../../util/dom";
import { ReactElement } from "react";

export const Train = ({
  route,
  label,
  highlight,
  className: extraClassName,
}: {
  route: "Red-Ashmont" | "Red-Braintree";
  label: string;
  highlight?: boolean;
  className?: string;
}): ReactElement => {
  return (
    <div
      className={className([
        "m-1 flex items-center justify-center rounded-3xl w-24 h-10 font-semibold",
        highlight ? "border-[3px] animate-pulse" : "border",
        route === "Red-Braintree" ? "border-crimson"
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        : route === "Red-Ashmont" ? "border-tangerine"
        : "",
        extraClassName,
      ])}
    >
      {label}
    </div>
  );
};
