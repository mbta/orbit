/**
 * This is a placeholder test to show that jest is set up and working
 * It can be removed once we have our first real functionality to test
 * (which will probably be a basic render(<App/>) test when we set up React)
 */

import { onePlusOne } from "./helloWorld";

describe("onePlusOne", () => {
  test("can run a test", () => {
    // using toBeOneOf shows that jest-extended-matchers is working
    // and therefore that the setup script is being called
    expect(onePlusOne()).toBeOneOf([1, 2, 3]);
  });
});
