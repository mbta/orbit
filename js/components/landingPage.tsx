import { paths } from "../paths";
import { MenuLink } from "./menuLink";

export const LandingPage = () => {
  const menuLinkClassName =
    "dark:bg-button-primary-background-dark dark:text-button-primary-text-dark light:bg-button-primary-background-light light:text-button-primary-text-light";

  return (
    <main className="relative top-14 pt-16 mx-auto w-96 flex flex-col justify-center">
      <p className="mb-6 dark:text-ladder-text-primary-dark light:text-ladder-text-primary-light">
        Which line would you like to view?
      </p>
      <MenuLink
        icon="red-line"
        iconExtraClassName="h-6 mr-2"
        buttonType="primary"
        buttonSize="large"
        extraClassName={menuLinkClassName}
        to={paths.ladder}
      >
        Red Line Train Locations
      </MenuLink>
      <MenuLink
        icon="blue-line"
        iconExtraClassName="h-6 mr-2"
        buttonType="primary"
        buttonSize="large"
        extraClassName={menuLinkClassName}
        to={paths.operators}
      >
        Blue Line Fit-For-Duty Sign In
      </MenuLink>
    </main>
  );
};
