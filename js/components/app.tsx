import { reload } from "../browser";
import { Help } from "./help";
import { Home } from "./home";
import { List } from "./operatorSignIn/list";
import { captureException } from "@sentry/react";
import { ReactElement, useEffect } from "react";
import {
  createBrowserRouter,
  RouterProvider,
  useRouteError,
} from "react-router-dom";

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
          <a href="/">Go back to the Orbit home page</a>.
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
    children: [
      {
        path: "/",
        element: <Home />,
      },
      {
        path: "/list",
        element: <List line="blue" />,
      },
      {
        path: "/help",
        element: <Help />,
      },
    ],
  },
]);
export const App = (): ReactElement => {
  return <RouterProvider router={router}></RouterProvider>;
};
