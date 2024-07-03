import { fetch } from "../../browser";
import { findEmployeeByBadge, useEmployees } from "../../hooks/useEmployees";
import { PromiseWithResolvers } from "../helpers/promiseWithResolvers";
import { renderHook, waitFor } from "@testing-library/react";

jest.mock("../../browser", () => ({
  __esModule: true,
  fetch: jest.fn(),
}));

const TEST_DATA = {
  data: [
    {
      first_name: "Christopher",
      preferred_first: "Chris",
      last_name: "Robin",
      badge: "123",
    },
  ],
};

const TEST_PARSED = [
  {
    first_name: "Christopher",
    preferred_first: undefined,
    last_name: "Robin",
    badge: "123",
  },
];

describe("useEmployees", () => {
  test("parses api response", async () => {
    const { promise, resolve } = PromiseWithResolvers<Response>();
    jest.mocked(fetch).mockReturnValue(promise);

    const { result } = renderHook(useEmployees);

    resolve({
      status: 200,
      json: () =>
        new Promise((resolve) => {
          resolve(TEST_DATA);
        }),
    } as Response);

    await waitFor(() => {
      expect(result.current).toEqual({ status: "ok", result: TEST_PARSED });
    });
  });
});

describe("findEmployeeByBadge", () => {
  test("finds an employee in an array by badge number", () => {
    expect(findEmployeeByBadge(TEST_PARSED, "123")).toEqual(TEST_PARSED[0]);
  });

  test("returns undefined if not found", () => {
    expect(findEmployeeByBadge(TEST_PARSED, "1234")).toBeUndefined();
  });
});
