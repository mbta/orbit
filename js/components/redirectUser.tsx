import {
  ORBIT_BL_FFD,
  ORBIT_BL_STAKEHOLDERS,
  ORBIT_HR_STAKEHOLDERS,
  ORBIT_TID_STAFF,
  userHasOneOf,
} from "../groups";
import { Navigate } from "react-router";

/* responsible for rerouting users from root "/" to different
Orbit endpoints based off the usergroups */
export const RedirectUser = () => {
  if (
    userHasOneOf([
      ORBIT_TID_STAFF,
      ORBIT_BL_STAKEHOLDERS,
      ORBIT_HR_STAKEHOLDERS,
    ])
  ) {
    return <Navigate to={"/landing"} />;
  } else if (userHasOneOf([ORBIT_BL_FFD])) {
    return <Navigate to={"/operators"} />;
  } else {
    return <Navigate to={"/ladder"} />;
  }
};
