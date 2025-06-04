import {
  trainThemeFromRoutePatternId,
  TrainThemes,
} from "../../../components/ladderPage/trainTheme";

describe("trainThemeFromRoutePatternId", () => {
  test("returns tangerine theme for expected Ashmont pattern IDs", () => {
    expect(trainThemeFromRoutePatternId("Red-1-0")).toEqual(
      TrainThemes.tangerine,
    );
    expect(trainThemeFromRoutePatternId("Red-1-1")).toEqual(
      TrainThemes.tangerine,
    );
  });

  test("returns crimson theme for expected Braintree pattern IDs", () => {
    expect(trainThemeFromRoutePatternId("Red-3-0")).toEqual(
      TrainThemes.crimson,
    );
    expect(trainThemeFromRoutePatternId("Red-3-1")).toEqual(
      TrainThemes.crimson,
    );
  });

  test("returns undefined if pattern ID matches no expected route pattern", () => {
    expect(trainThemeFromRoutePatternId("Some-Other-Pattern")).toBeUndefined();
  });
});
