import { paths } from "../paths";
import { MenuLink } from "./menuLink";

export const NoPermissions = () => {
  return (
    <main className="w-5/6 mx-auto mt-4 max-w-[400px]">
      <h2 className="text-xl mb-6">
        Email your supervisor if you think you should have permission to use
        this page.
      </h2>

      <MenuLink to={paths.operators} reload={true}>
        Retry hitting /operators w/ reload
      </MenuLink>

      {/* TODO: remove */}
      <MenuLink to={"/auth/keycloak"} reload={true}>
        Retry hitting keycloak auth
      </MenuLink>
    </main>
  );
};
