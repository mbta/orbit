import "@testing-library/jest-dom";
import { neverPromise } from "./helpers/promiseWithResolvers";
// add all jest-extended matchers
import * as jestExtendedMatchers from "jest-extended";

expect.extend(jestExtendedMatchers);

// always prevent these side-effects from being called in tests
jest.mock("../browser", () => ({
  fetch: jest.fn(() => neverPromise()),
  reload: jest.fn(),
}));
jest.mock("phoenix");
