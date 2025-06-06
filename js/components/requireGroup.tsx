import { getMetaContent } from "../util/metadata";
import { NoPermissions } from "./noPermissions";
import { ReactNode } from "react";

export const RequireGroup = ({
  group,
  children,
}: {
  group: string;
  children?: ReactNode;
}) => {
  if (getMetaContent("userGroups")?.split(",").includes(group)) {
    return children;
  } else {
    return <NoPermissions />;
  }
};
