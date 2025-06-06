export type MetaDataKey =
  | "appcuesUserId"
  | "csrf-token"
  | "environment"
  | "fullStoryOrgId"
  | "guardianToken"
  | "release"
  | "sentryDsn"
  | "userEmail"
  | "userGroups"
  | "userName";

export const getMetaContent = (field: MetaDataKey): string | null => {
  const element = document.querySelector(`meta[name=${field}]`);

  if (element) {
    return element.getAttribute("content");
  } else {
    return null;
  }
};
