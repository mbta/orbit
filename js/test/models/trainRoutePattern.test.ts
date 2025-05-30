import { trainRoutePatternFromId } from "../../models/trainRoutePattern";

describe("trainRoutePatternFromId", () => {
  test("derives Red-Ashmont patterns from expected pattern IDs", () => {
    expect(trainRoutePatternFromId("Red-1-0")).toBe("Red-Ashmont");
    expect(trainRoutePatternFromId("Red-1-1")).toBe("Red-Ashmont");
  });

  test("derives Red-Braintree patterns from expected pattern IDs", () => {
    expect(trainRoutePatternFromId("Red-3-0")).toBe("Red-Braintree");
    expect(trainRoutePatternFromId("Red-3-1")).toBe("Red-Braintree");
  });

  test("returns undefined if pattern ID matches no expected route pattern", () => {
    expect(trainRoutePatternFromId("Some-Other-Pattern")).toBeUndefined();
  });
});
