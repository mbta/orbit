import { fetch } from "../../browser";
import {
  fetchEmployeeByBadgeSerial,
  findEmployeeByBadge,
  lookupDisplayName,
  useEmployees,
} from "../../hooks/useEmployees";
import { employeeFactory } from "../helpers/factory";
import { PromiseWithResolvers } from "../helpers/promiseWithResolvers";
import { renderHook, waitFor } from "@testing-library/react";

jest.mock("../../browser", () => ({
  fetch: jest.fn(),
}));

const TEST_DATA = {
  data: [
    employeeFactory.build(),
    employeeFactory.build({
      preferred_first: null,
    }),
  ],
};

const TEST_PARSED = TEST_DATA.data;

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

describe("lookupDisplayName", () => {
  test("can retrieve/compute the display name for an employee", () => {
    expect(lookupDisplayName(TEST_PARSED[0].badge, TEST_PARSED)).toBe(
      "Preferredy Lasty",
    );
  });
  test("can use the fallback string for an unknown operator", () => {
    expect(lookupDisplayName("49203492152352341", TEST_PARSED)).toBe(
      "Operator #49203492152352341",
    );
  });
});

describe("findEmployeeByBadge", () => {
  test("finds an employee in an array by badge number", () => {
    const employeeBadge = TEST_PARSED[0].badge;

    expect(findEmployeeByBadge(TEST_PARSED, employeeBadge)).toEqual(
      TEST_PARSED[0],
    );
  });

  test("returns undefined if not found", () => {
    expect(findEmployeeByBadge(TEST_PARSED, "random_badge")).toBeUndefined();
  });
});

describe("fetchEmployeeByBadgeSerial", () => {
  test("finds an employee", async () => {
    const { promise, resolve } = PromiseWithResolvers<Response>();
    jest.mocked(fetch).mockReturnValue(promise);

    const result = fetchEmployeeByBadgeSerial("9999");

    resolve({
      status: 200,
      json: () =>
        new Promise((resolve) => {
          resolve({ data: "123" });
        }),
    } as Response);

    await expect(result).resolves.toBe("123");
  });

  test("rejects if employee isn't found", async () => {
    const { promise, resolve } = PromiseWithResolvers<Response>();
    jest.mocked(fetch).mockReturnValue(promise);

    const result = fetchEmployeeByBadgeSerial("9999");

    resolve({ status: 404 } as Response);
    await expect(result).toReject();
  });
});
