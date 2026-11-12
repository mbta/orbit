import { IconName } from "../icons";
import { className } from "../util/dom";
import { Button } from "rail-tech-ui";
import { ReactElement } from "react";
import { Link } from "react-router";

export const MenuLink = ({
  to,
  icon,
  iconExtraClassName,
  iconColor,
  buttonType,
  buttonSize,
  reload,
  newTab,
  children,
  extraClassName,
}: {
  to: string;
  icon?: IconName;
  iconExtraClassName?: string;
  iconColor?: string;
  buttonType: "primary" | "secondary" | "tertiary" | "quaternary";
  buttonSize: "small" | "medium" | "large";
  reload?: boolean;
  newTab?: boolean;
  children: string;
  extraClassName?: string;
}): ReactElement => (
  <Link
    to={to}
    reloadDocument={reload}
    target={newTab ? "_blank" : undefined}
    rel={newTab ? "noopener noreferrer" : undefined}
  >
    <Button
      type={buttonType}
      size={buttonSize}
      onClick={() => null}
      className={className([
        "flex items-center justify-center gap-2 font-semibold mx-auto w-full rounded bg-none hover:bg-gray-200 p-1 mb-6",
        extraClassName,
      ])}
    >
      {icon &&
        (iconColor ?
          <span
            aria-hidden="true"
            className={className([
              "inline-block align-middle",
              iconExtraClassName,
            ])}
            style={{
              backgroundColor: iconColor,
              mask: `url(/images/${icon}.svg) center / contain no-repeat`,
              WebkitMask: `url(/images/${icon}.svg) center / contain no-repeat`,
            }}
          />
        : <img
            src={`/images/${icon}.svg`}
            // Per MDN re: alt text:
            // > If the image doesn't require a fallback (such as for an image which is decorative or an advisory icon
            //   of minimal importance), you may specify an empty string ("")
            alt={""}
            className={className(["inline", iconExtraClassName])}
          />)}
      {children}
    </Button>
  </Link>
);
