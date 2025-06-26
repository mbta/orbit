import { userHasOneOf } from "../groups";
import { NoPermissions } from "./noPermissions";
import { ReactNode } from "react";

export const RequireGroup = ({
  oneOf,
  children,
}: {
  oneOf: string[];
  children?: ReactNode;
}) => {
  if (userHasOneOf(oneOf)) {
    return children;
  } else {
    return <NoPermissions />;
  }
};
