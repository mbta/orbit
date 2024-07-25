import "@testing-library/jest-dom";
import { neverPromise } from "./helpers/promiseWithResolvers";
// add all jest-extended matchers
import * as jestExtendedMatchers from "jest-extended";

expect.extend(jestExtendedMatchers);

jest.mock("../browser", () => ({
  fetch: jest.fn(() => neverPromise()),
  reload: jest.fn(),
}));
