import { ColorSchemeSetting } from "./colorScheme";

export type LocalStorageKey = "COLOR-SCHEME";

type LocalStorageTypes = {
  "COLOR-SCHEME": ColorSchemeSetting;
};

export const getLocalStorage = <Key extends LocalStorageKey>(
  key: Key,
): LocalStorageTypes[Key] | null =>
  localStorage.getItem(key) as LocalStorageTypes[Key];

export const setLocalStorage = <Key extends LocalStorageKey>(
  key: Key,
  value: LocalStorageTypes[Key],
) => {
  localStorage.setItem(key, value);
};
