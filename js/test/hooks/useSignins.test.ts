import { fetch } from "../../browser";
import { useSignins } from "../../hooks/useSignIns";
import { PromiseWithResolvers } from "../helpers/promiseWithResolvers";
import { renderHook, waitFor } from "@testing-library/react";
import { DateTime } from "luxon";

jest.mock("../../browser", () => ({
  fetch: jest.fn(),
}));

const TEST_DATA = {
  data: [
    {
      rail_line: "blue",
      signed_in_at: "2024-07-22T16:42:32Z",
      signed_in_by_user: "user@example.com",
      signed_in_employee: "123",
    },
  ],
};

const TEST_PARSED = [
  {
    ...TEST_DATA.data[0],
    signed_in_at: DateTime.fromISO(TEST_DATA.data[0].signed_in_at, {
      zone: "America/New_York",
    }),
  },
];

describe("useSignins", () => {
  test("parses api response", async () => {
    const { promise, resolve } = PromiseWithResolvers<Response>();
    jest.mocked(fetch).mockReturnValue(promise);

    const { result } = renderHook(useSignins);

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
