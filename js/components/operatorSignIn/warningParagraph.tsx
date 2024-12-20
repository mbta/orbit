import { className } from "../../util/dom";
import { ReactElement, ReactNode } from "react";

export const WarningParagraph = ({
  children,
  className: extraClassName,
}: {
  children: ReactNode;
  className?: string;
}): ReactElement => {
  return (
    <div
      className={className([
        "mb-4 mt-2 flex flex-row rounded border border-solid px-3 py-2",
        extraClassName,
      ])}
    >
      <div className="m-0 flex-1 text-xs leading-4">{children}</div>
    </div>
  );
};
