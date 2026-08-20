import { getLocalStorage, setLocalStorage } from "./localStorage";

type ColorScheme = "light" | "dark";

export type ColorSchemeSetting = "light" | "dark" | "system";

const defaultSetting: ColorSchemeSetting = "dark";

const setColorScheme = (scheme: ColorScheme) => {
  switch (scheme) {
    case "light":
      document.documentElement.classList.add("light");
      document.documentElement.classList.remove("dark");
      return;
    case "dark":
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
      return;
  }
};

let mediaQueryMatch: MediaQueryList | null = null;

const readFromSystem = ({ matches: matchesLight }: { matches: boolean }) => {
  if (matchesLight) {
    setColorScheme("light");
  } else {
    setColorScheme("dark");
  }
};

const applyColorSchemeSetting = (setting: ColorSchemeSetting) => {
  if (setting === "system") {
    // eslint-disable-next-line better-mutation/no-mutation
    mediaQueryMatch = window.matchMedia("(prefers-color-scheme: light)");
    readFromSystem(mediaQueryMatch);
    mediaQueryMatch.addEventListener("change", readFromSystem);
  } else {
    if (mediaQueryMatch !== null) {
      mediaQueryMatch.removeEventListener("change", readFromSystem);
    }
    setColorScheme(setting);
  }
};

const loadColorSchemeSetting = () => {
  applyColorSchemeSetting(getColorSchemeSetting());
};

export const getColorSchemeSetting = () => {
  return getLocalStorage("COLOR-SCHEME") ?? defaultSetting;
};

export const saveColorSchemeSetting = (setting: ColorSchemeSetting) => {
  applyColorSchemeSetting(setting);
  setLocalStorage("COLOR-SCHEME", setting);
};

export const initColorScheme = () => {
  loadColorSchemeSetting();
};
