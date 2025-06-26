import { MenuLink } from "./menuLink";

export const NoPermissions = () => {
  return (
    <main className="w-5/6 mx-auto max-w-[400px] relative top-14">
      <h2 className="text-xl mb-6">
        Email your supervisor if you think you should have permission to use
        this page.
      </h2>

      <MenuLink to="/auth/keycloak" reload={true}>
        Retry
      </MenuLink>
    </main>
  );
};
