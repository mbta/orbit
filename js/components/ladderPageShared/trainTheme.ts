export type TrainTheme = {
  backgroundColor: string;
  borderColor: string;
  strokeColor: string;
};

export const TrainThemes: Record<string, TrainTheme> = {
  braintree: {
    backgroundColor: "bg-heavy-rail-braintree",
    borderColor: "border-heavy-rail-braintree",
    strokeColor: "stroke-heavy-rail-braintree",
  },
  ashmont: {
    backgroundColor: "bg-heavy-rail-ashmont",
    borderColor: "border-heavy-rail-ashmont",
    strokeColor: "stroke-heavy-rail-ashmont",
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
  ["Red-1-0", TrainThemes.ashmont],
  ["Red-1-1", TrainThemes.ashmont],
  ["Red-3-0", TrainThemes.braintree],
  ["Red-3-1", TrainThemes.braintree],
]);
