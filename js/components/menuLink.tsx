import { IconName } from "../icons";
import { className } from "../util/dom";
import { ReactElement } from "react";
import { Link } from "react-router";

export const MenuLink = ({
  to,
  icon,
  iconExtraClassName,
  reload,
  newTab,
  children,
}: {
  to: string;
  icon?: IconName;
  iconExtraClassName?: string;
  reload?: boolean;
  newTab?: boolean;
  children: string;
}): ReactElement => (
  <Link
    to={to}
    reloadDocument={reload}
    target={newTab ? "_blank" : undefined}
    rel={newTab ? "noopener noreferrer" : undefined}
  >
    <button className="block font-semibold mx-auto w-full rounded border border-gray-300 bg-none hover:bg-gray-200 p-1 mb-6">
      {icon && (
        <img
          src={`/images/${icon}.svg`}
          // Per MDN re: alt text:
          // > If the image doesn't require a fallback (such as for an image which is decorative or an advisory icon
          //   of minimal importance), you may specify an empty string ("")
          alt={""}
          className={className(["inline", iconExtraClassName])}
        />
      )}
      {children}
    </button>
  </Link>
);
