import { paths } from "../paths";
import { MenuLink } from "./menuLink";

export const LandingPage = () => {
  return (
    <div className="mt-20 mx-auto w-96 flex flex-col justify-center">
      <p className="mb-6">Which line would you like to view?</p>
      <MenuLink icon="red-line" iconExtraClassName="h-6 mr-2" to={paths.ladder}>
        Red Line Train Locations
      </MenuLink>
      <MenuLink
        icon="blue-line"
        iconExtraClassName="h-6 mr-2"
        to={paths.operators}
      >
        Blue Line Fit-For-Duty Sign In
      </MenuLink>
    </div>
  );
};
