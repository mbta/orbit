import { paths } from "../paths";
import { className } from "../util/dom";
import { Link, useLocation } from "react-router-dom";

export const Header = () => {
  const currentLocation = useLocation();
  const menuSelected =
    currentLocation.pathname === paths.menu ||
    currentLocation.pathname === paths.help;

  return (
    <div className="w-full bg-gray-200 p-2 flex justify-between">
      <Link to={"/"}>
        <img src="/images/logo.svg" alt="MBTA" className="w-44" />
      </Link>
      <Link to={paths.menu}>
        <button
          className={className([
            "border border-black bg-gray-200 rounded w-8 h-8",
            menuSelected && "invert border-white",
          ])}
        >
          <img
            src="/images/menu.svg"
            alt="Menu"
            className="w-full h-full text-black"
          />
        </button>
      </Link>
    </div>
  );
};
