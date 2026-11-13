import { paths } from "../paths";
import {
  ColorSchemeSetting,
  getColorSchemeSetting,
  saveColorSchemeSetting,
} from "../util/colorScheme";
import { getMetaContent } from "../util/metadata";
import { MenuLink } from "./menuLink";
import { ReactElement, useState } from "react";
import { Link } from "react-router";

const ColorSchemeSelect = (): ReactElement => {
  const [value, setValue] = useState(() => getColorSchemeSetting());
  return (
    <label className="w-full">
      <span className="text-xs font-semibold">Color Mode</span>
      <select
        className="w-full rounded border appearance-auto dark:bg-slate-600"
        value={value}
        onChange={(evt) => {
          const value = evt.target.value as ColorSchemeSetting;
          saveColorSchemeSetting(value);
          setValue(value);
        }}
      >
        <option value="dark">Dark</option>
        <option value="light">Light</option>
        <option value="system">Auto/System</option>
      </select>
    </label>
  );
};

export const Menu = (): ReactElement => {
  const name = getMetaContent("userName");
  const email = getMetaContent("userEmail");

  return (
    <main className="w-5/6 mx-auto pt-4 max-w-[400px] relative top-14 dark:text-text-primary-dark light:text-text-primary-light">
      <h2 className="text-2xl mb-6">Hi, {name ?? email}</h2>

      <MenuLink
        icon="phone"
        iconExtraClassName="h-4 w-4"
        iconColor="currentColor"
        buttonType="quaternary"
        buttonSize="medium"
        to={paths.help}
        extraClassName={"mb-1"}
      >
        Call Help Desk
      </MenuLink>

      <div className="mb-6 text-xs dark:text-text-primary-dark light:text-text-primary-light">
        If you are experiencing issues with Orbit, call Help Desk{" "}
        <Link className="underline" to={"tel:+1-617-222-5761"}>
          617-222-5761
        </Link>{" "}
        or email{" "}
        <Link className="underline" to={"mailto:helpdesk@mbta.com"}>
          helpdesk@mbta.com
        </Link>
        .
      </div>

      <MenuLink
        icon="help"
        iconExtraClassName="h-7 w-7"
        iconColor="currentColor"
        buttonType="quaternary"
        buttonSize="medium"
        to={paths.help}
        extraClassName={"mb-6"}
      >
        Support Resources
      </MenuLink>
      <ColorSchemeSelect />
      <hr className="mx-auto my-8 w-full border-glides-blue-800" />
      <MenuLink
        icon="feedback"
        iconExtraClassName="h-7 w-7"
        iconColor="currentColor"
        buttonType="quaternary"
        buttonSize="medium"
        newTab={true}
        to="https://form.asana.com/?k=NS0FKd0bBpHpURLbD3jmeg&d=15492006741476"
        extraClassName={"mb-1"}
      >
        Send Feedback
      </MenuLink>

      <div className="mb-6 text-xs dark:text-text-primary-dark light:text-text-primary-light">
        If you have a suggestion or opinion to share, use the feedback form to
        send it to the Orbit team.
      </div>

      <MenuLink
        icon={"sign-out"}
        iconExtraClassName="h-5 w-5 mr-1"
        iconColor="currentColor"
        buttonType="quaternary"
        buttonSize="medium"
        to={paths.logout}
        reload={true}
        extraClassName={"mb-6"}
      >
        Logout
      </MenuLink>
      <div className="flex flex-col items-center text-xs text-center">
        <span
          aria-hidden="true"
          className="mb-1 inline-block align-middle h-7 w-7 light:bg-alt-blue-700 dark:bg-blue-300"
          style={{
            mask: "url(/images/T.svg) center / contain no-repeat",
          }}
        />
        Orbit is a product of the Transformation & Technology Department at the
        MBTA.
      </div>
    </main>
  );
};

export const HelpMenu = (): ReactElement => {
  return (
    <main className="w-5/6 mx-auto pt-4 max-w-[400px] relative top-14 dark:text-text-primary-dark light:text-text-primary-light">
      <Link
        className="mb-6 tracking-widest h-full w-16 text-sm font-semibold uppercase no-underline"
        to={paths.menu}
      >
        <span
          aria-hidden="true"
          className="inline-block align-middle h-5 w-5 mr-1"
          style={{
            backgroundColor: "currentColor",
            mask: `url(/images/back.svg) center / contain no-repeat`,
          }}
        />
        Back
      </Link>

      <h2 className="text-2xl my-8">Support Resources</h2>

      <MenuLink
        buttonType="quaternary"
        buttonSize="medium"
        newTab={true}
        to="https://www.mbta.com/orbit-user-guide"
        extraClassName={"mb-6"}
      >
        User Guide
      </MenuLink>
      <MenuLink
        buttonType="quaternary"
        buttonSize="medium"
        newTab={true}
        to="https://www.mbta.com/orbit-training"
        extraClassName={"mb-6"}
      >
        Training Materials
      </MenuLink>
      <hr className="mx-auto my-8 w-full border-glides-blue-800" />
      <div className="text-sm">
        For additional help, call Help desk 617-222-5761 or email{" "}
        <Link className="underline" to={"mailto:helpdesk@mbta.com"}>
          helpdesk@mbta.com
        </Link>
        .
      </div>
    </main>
  );
};
