import {
  TrainThemes,
  trainThemesByRoutePattern,
} from "../../../components/ladderPageShared/trainTheme";

describe("trainThemesByRoutePattern", () => {
  test("returns ashmont theme for expected Ashmont pattern IDs", () => {
    expect(trainThemesByRoutePattern.get("Red-1-0")).toEqual(
      TrainThemes.ashmont,
    );
    expect(trainThemesByRoutePattern.get("Red-1-1")).toEqual(
      TrainThemes.ashmont,
    );
  });

  test("returns braintree theme for expected Braintree pattern IDs", () => {
    expect(trainThemesByRoutePattern.get("Red-3-0")).toEqual(
      TrainThemes.braintree,
    );
    expect(trainThemesByRoutePattern.get("Red-3-1")).toEqual(
      TrainThemes.braintree,
    );
  });

  test("returns undefined if pattern ID matches no expected route pattern", () => {
    expect(trainThemesByRoutePattern.get("Some-Other-Pattern")).toBeUndefined();
  });
});
