import { paths } from "../paths";
import { className } from "../util/dom";
import { Link, useLocation } from "react-router";

export const Header = () => {
  const currentLocation = useLocation();
  const menuSelected =
    currentLocation.pathname === paths.menu ||
    currentLocation.pathname === paths.help;

  return (
    <div className="w-full p-2 flex justify-between h-header dark:bg-menu-background-dark light:bg-menu-background-light">
      <Link to={paths.root}>
        <img
          src="/images/logo_white.svg"
          alt="MBTA logo"
          className="w-44 h-[32px]"
        />
      </Link>
      <Link to={paths.menu}>
        <button
          className={className([
            "rounded w-8 h-8",
            menuSelected ?
              "dark:bg-menu-button-active-dark light:bg-menu-button-active-light"
            : "dark:bg-menu-button-default-dark light:bg-menu-button-default-light",
          ])}
        >
          <img
            src="/images/menu.svg"
            alt="Menu"
            className="w-full h-full invert"
          />
        </button>
      </Link>
    </div>
  );
};
