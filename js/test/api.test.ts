import { useApiResult } from "../api";
import { fetch } from "../browser";
import { PromiseWithResolvers } from "./helpers/promiseWithResolvers";
import { renderHook, waitFor } from "@testing-library/react";
import { z } from "zod";

jest.mock("../browser", () => ({
  __esModule: true,
  fetch: jest.fn(),
}));

describe("useApiResult", () => {
  test("returns loading state", () => {
    const RawData = z.string();
    const parser = (s: String) => s;

    jest.mocked(fetch).mockReturnValue(new Promise(jest.fn()));

    const { result } = renderHook(useApiResult, {
      initialProps: { RawData, url: "/api/test", parser },
    });

    expect(result.current).toEqual({ status: "loading" });
  });

  test("handles success state", async () => {
    const RawData = z.string();
    const parser = (s: String) => s;

    const { promise, resolve } = PromiseWithResolvers<Response>();

    jest.mocked(fetch).mockReturnValue(promise);

    const { result } = renderHook(useApiResult, {
      initialProps: { RawData, url: "/api/test", parser },
    });

    resolve({
      status: 200,
      json: () =>
        new Promise((resolve) => {
          resolve({ data: "test" });
        }),
    } as Response);

    await waitFor(() =>
      expect(result.current).toEqual({ status: "ok", result: "test" }),
    );
  });
});
