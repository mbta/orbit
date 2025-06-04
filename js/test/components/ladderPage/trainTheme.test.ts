import {
  TrainThemes,
  trainThemesByRoutePattern,
} from "../../../components/ladderPage/trainTheme";

describe("trainThemesByRoutePattern", () => {
  test("returns tangerine theme for expected Ashmont pattern IDs", () => {
    expect(trainThemesByRoutePattern.get("Red-1-0")).toEqual(
      TrainThemes.tangerine,
    );
    expect(trainThemesByRoutePattern.get("Red-1-1")).toEqual(
      TrainThemes.tangerine,
    );
  });

  test("returns crimson theme for expected Braintree pattern IDs", () => {
    expect(trainThemesByRoutePattern.get("Red-3-0")).toEqual(
      TrainThemes.crimson,
    );
    expect(trainThemesByRoutePattern.get("Red-3-1")).toEqual(
      TrainThemes.crimson,
    );
  });

  test("returns undefined if pattern ID matches no expected route pattern", () => {
    expect(trainThemesByRoutePattern.get("Some-Other-Pattern")).toBeUndefined();
  });
});
