import { getMetaContent } from "./util/metadata";

export const ORBIT_BL_FFD = "orbit-bl-ffd";
export const ORBIT_RL_TRAINSTARTERS = "orbit-rl-trainstarters";
export const ORBIT_TID_STAFF = "orbit-tid-staff";
// TODO: confirm final name of new groups
export const ORBIT_BL_STAKEHOLDERS = "orbit-bl-stakeholders";
export const ORBIT_HR_STAKEHOLDERS = "orbit-hr-stakeholders";

export const userHasOneOf = (desiredGroups: string[]) => {
  const userGroups = getMetaContent("userGroups")?.split(",");
  if (userGroups === undefined) {
    return false;
  }

  return desiredGroups.some((group) => userGroups.includes(group));
};
