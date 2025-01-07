import { fetch } from "../../browser";
import { useCertifications } from "../../hooks/useCertifications";
import { filterRelevantForOperator } from "../../models/certification";
import {
  certificationDataFactory,
  certificationFactory,
} from "../helpers/factory";
import { PromiseWithResolvers } from "../helpers/promiseWithResolvers";
import { renderHook, waitFor } from "@testing-library/react";
import { DateTime } from "luxon";

jest.mock("../../browser", () => ({
  fetch: jest.fn(),
}));

// eslint-disable-next-line @typescript-eslint/no-unsafe-return
jest.mock("../../models/certification", () => ({
  ...jest.requireActual("../../models/certification"),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  filterRelevantForOperator: jest.fn((cs, _line) => cs),
}));

const TEST_DATA = {
  data: [certificationDataFactory.build()],
};

const TEST_PARSED = [certificationFactory.build()];

describe("useCertifications", () => {
  test("parses api response", async () => {
    const { promise, resolve } = PromiseWithResolvers<Response>();
    jest.mocked(fetch).mockReturnValue(promise);

    const { result } = renderHook(() => useCertifications("1234", "blue"));

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

  test("calls filterRelevantForOperator", async () => {
    const { promise, resolve } = PromiseWithResolvers<Response>();
    jest.mocked(fetch).mockReturnValue(promise);

    const line = "blue";

    renderHook(() => useCertifications("1234", line));

    resolve({
      status: 200,
      json: () =>
        new Promise((resolve) => {
          resolve(TEST_DATA);
        }),
    } as Response);

    await waitFor(() => {
      expect(filterRelevantForOperator).toHaveBeenCalledWith(
        [
          {
            expires: expect.any(DateTime),
            railLine: "blue",
            type: "rail",
          },
        ],
        line,
      );
    });
  });
});
