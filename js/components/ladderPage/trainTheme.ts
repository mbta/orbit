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
    backgroundColor: "bg-glides-gray-400",
    borderColor: "border-glides-gray-400",
    strokeColor: "stroke-glides-gray-400",
  },
  blue: {
    backgroundColor: "bg-heavy-rail-blue-line",
    borderColor: "border-heavy-rail-blue-line",
    strokeColor: "stroke-heavy-rail-blue-line",
  },
  orange: {
    backgroundColor: "bg-heavy-rail-orange-line",
    borderColor: "border-heavy-rail-orange-line",
    strokeColor: "stroke-heavy-rail-orange-line",
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
