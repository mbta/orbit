import { fetch } from "../../browser";
import {
  findEmployeeByBadge,
  findEmployeeByBadgeSerial,
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

describe("findEmployeeByBadgeSerial", () => {
  test("finds an employee in an array by badge number", () => {
    const employeeBadgeSerial = TEST_PARSED[0].badge_serials[0];

    expect(findEmployeeByBadgeSerial(TEST_PARSED, employeeBadgeSerial)).toEqual(
      TEST_PARSED[0],
    );
  });

  test("returns undefined if not found", () => {
    expect(
      findEmployeeByBadgeSerial(TEST_PARSED, "random_serial"),
    ).toBeUndefined();
  });
});
