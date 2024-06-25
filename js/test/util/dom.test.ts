import { className } from "../../util/dom";

describe("className", () => {
  test("includes non-null / -undefined / -empty classes", () => {
    expect(className(["foo", "bar"])).toBe("foo bar");
  });

  test("excludes null, undefined, and empty classes", () => {
    expect(className(["foo", null, undefined, ""])).toBe("foo");
  });
});
