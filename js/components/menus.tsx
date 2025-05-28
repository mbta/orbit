import { paths } from "../paths";
import { getMetaContent } from "../util/metadata";
import { MenuLink } from "./menuLink";
import { ReactElement } from "react";
import { Link } from "react-router";

export const Menu = (): ReactElement => {
  const name = getMetaContent("userName");
  const email = getMetaContent("userEmail");

  return (
    <main className="w-5/6 mx-auto mt-4 max-w-[400px]">
      <h2 className="text-2xl mb-6">Hi, {name ?? email}</h2>

      <MenuLink icon="help" iconExtraClassName="h-7 w-7" to={paths.help}>
        Help
      </MenuLink>
      <MenuLink
        icon="feedback"
        iconExtraClassName="h-7 w-7"
        newTab={true}
        to="https://form.asana.com/?k=NS0FKd0bBpHpURLbD3jmeg&d=15492006741476"
      >
        Send Feedback
      </MenuLink>
      <hr className="mx-auto my-8 w-full" />
      <MenuLink
        icon={"sign-out"}
        iconExtraClassName="h-5 w-5 mr-1"
        to={paths.logout}
        reload={true}
      >
        Logout
      </MenuLink>
    </main>
  );
};

export const HelpMenu = (): ReactElement => {
  return (
    <main className="w-5/6 mx-auto mt-4 max-w-[400px]">
      <Link
        className="mb-6 tracking-widest h-full w-16 text-sm font-semibold uppercase no-underline"
        to={paths.menu}
      >
        <img
          src={`/images/back.svg`}
          alt={"Back"}
          className="w-5 inline -translate-y-0.5"
        />
        Back
      </Link>

      <h2 className="text-2xl my-8">How can we help?</h2>

      <MenuLink
        icon="info"
        iconExtraClassName="w-4 mr-2"
        newTab={true}
        to="https://www.mbta.com/orbit-user-guide"
      >
        User Guide
      </MenuLink>
      <MenuLink
        icon="clipboard"
        iconExtraClassName="w-3 mr-2"
        newTab={true}
        to="https://www.mbta.com/orbit-training"
      >
        Training Materials
      </MenuLink>
      <hr className="mx-auto my-8 w-full" />
      <div>
        For more support, contact{" "}
        <Link className="underline" to={"mailto:helpdesk@mbta.com"}>
          helpdesk@mbta.com
        </Link>{" "}
        or{" "}
        <Link className="underline" to={"tel:+1-617-222-5761"}>
          617-222-5761
        </Link>{" "}
        and mention that you are having an issue with Orbit.
      </div>
    </main>
  );
};
