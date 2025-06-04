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

export const trainThemesByRoutePattern: ReadonlyMap<
  string,
  Readonly<TrainTheme>
> = new Map([
  ["Red-1-0", TrainThemes.tangerine],
  ["Red-1-1", TrainThemes.tangerine],
  ["Red-3-0", TrainThemes.crimson],
  ["Red-3-1", TrainThemes.crimson],
]);
