import { reload } from "../browser";
import { SocketProvider } from "../contexts/socketContext";
import { ORBIT_BL_FFD, ORBIT_TID_STAFF } from "../groups";
import { paths } from "../paths";
import { AppcuesTrackPage } from "./appcues";
import { Header } from "./header";
import { LadderPage } from "./ladderPage/ladderPage";
import { LandingPage } from "./landingPage";
import { HelpMenu, Menu } from "./menus";
import { Operators } from "./operators";
import { RequireGroup } from "./requireGroup";
import { captureException } from "@sentry/react";
import { ReactElement, useEffect } from "react";
import {
  createBrowserRouter,
  Navigate,
  Outlet,
  RouterProvider,
  useRouteError,
} from "react-router";

const ErrorBoundary = (): ReactElement => {
  const error = useRouteError();
  useEffect(() => {
    captureException(error);
  }, [error]);
  return (
    <main className="container mx-auto">
      <p>Sorry, something went wrong. It&apos;s not you, it&apos;s us.</p>
      <p>Things you could try:</p>
      <ul className="list-inside list-disc mb-10">
        <li>
          <button type="button" className="underline" onClick={reload}>
            Refresh the page
          </button>
          .
        </li>
        <li>
          <a href={paths.root}>Go back to the Orbit home page</a>.
        </li>
        <li>Try again in a few minutes.</li>
        <li>Call the IT help desk. x5761</li>
      </ul>
      {error instanceof Error ?
        <p>
          Error details: {error.name} {error.message}
          <pre className="bg-gray-200">{error.stack}</pre>
        </p>
      : <p>Error details unavailable</p>}
    </main>
  );
};

const router = createBrowserRouter([
  {
    errorElement: <ErrorBoundary />,
    element: (
      <>
        <AppcuesTrackPage />
        <Header />
        <Outlet />
      </>
    ),
    children: [
      {
        path: paths.root,
        // "/" will redirect to "/operators" for now since blue line ffd was previously located there.
        element: <Navigate to="/operators" />,
      },
      {
        path: paths.menu,
        element: <Menu />,
      },
      {
        path: paths.help,
        element: <HelpMenu />,
      },
      {
        path: paths.ladder,
        element: <LadderPage routeId="Red" />,
      },
      {
        path: paths.operators,
        element: (
          <RequireGroup oneOf={[ORBIT_BL_FFD, ORBIT_TID_STAFF]}>
            <Operators />
          </RequireGroup>
        ),
      },
      {
        path: paths.landing,
        element: <LandingPage />,
      },
    ],
  },
]);
export const App = (): ReactElement => {
  return (
    <SocketProvider>
      <RouterProvider router={router}></RouterProvider>
    </SocketProvider>
  );
};
