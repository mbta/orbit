import { Help } from "./help";
import { Home } from "./home";
import { ReactElement } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/help",
    element: <Help />,
  },
]);
export const App = (): ReactElement => {
  return <RouterProvider router={router}></RouterProvider>;
};
