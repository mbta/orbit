export type TrainTheme = {
  backgroundColor: string;
  borderColor: string;
};

export const TrainThemes: Record<string, TrainTheme> = {
  crimson: {
    backgroundColor: "bg-crimson",
    borderColor: "border-crimson",
  },
  tangerine: {
    backgroundColor: "bg-tangerine",
    borderColor: "border-tangerine",
  },
} as const;

const themesByRoutePattern: Record<string, TrainTheme> = {
  "Red-1-0": TrainThemes.tangerine,
  "Red-1-1": TrainThemes.tangerine,
  "Red-3-0": TrainThemes.crimson,
  "Red-3-1": TrainThemes.crimson,
};

export const trainThemeFromRoutePatternId = (
  routePatternId: string,
): TrainTheme | undefined => {
  return themesByRoutePattern[routePatternId];
};
