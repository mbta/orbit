export type MetaDataKey =
  | "csrf-token"
  | "sentryDsn"
  | "environment"
  | "userEmail"
  | "userName"
  | "release";

export const getMetaContent = (field: MetaDataKey): string | null => {
  const element = document.querySelector(`meta[name=${field}]`);

  if (element) {
    return element.getAttribute("content");
  } else {
    return null;
  }
};
