export type TrainTheme = {
  backgroundColor: string;
  borderColor: string;
  strokeColor: string;
};

export const TrainThemes: Record<string, TrainTheme> = {
  crimson: {
    backgroundColor: "bg-crimson",
    borderColor: "border-crimson",
    strokeColor: "stroke-crimson",
  },
  tangerine: {
    backgroundColor: "bg-tangerine",
    borderColor: "border-tangerine",
    strokeColor: "stroke-tangerine",
  },
  gray: {
    backgroundColor: "bg-gray-300",
    borderColor: "border-gray-300",
    strokeColor: "stroke-gray-300",
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
