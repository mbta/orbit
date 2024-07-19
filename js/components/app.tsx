import { Help } from "./help";
import { Home } from "./home";
import { List } from "./operatorSignIn/list";
import { ReactElement } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

const router = createBrowserRouter([
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
]);
export const App = (): ReactElement => {
  return <RouterProvider router={router}></RouterProvider>;
};
