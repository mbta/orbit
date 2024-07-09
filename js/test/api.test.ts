import { useApiResult } from "../api";
import { fetch, reload } from "../browser";
import { PromiseWithResolvers } from "./helpers/promiseWithResolvers";
import { act, renderHook, waitFor } from "@testing-library/react";
import { z } from "zod";

jest.mock("../browser", () => ({
  __esModule: true,
  fetch: jest.fn(),
  reload: jest.fn(),
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

  test("reloads on a 401 response", async () => {
    const RawData = z.string();
    const parser = (s: String) => s;

    const { promise, resolve } = PromiseWithResolvers<Response>();

    jest.mocked(fetch).mockReturnValue(promise);

    const { result } = renderHook(useApiResult, {
      initialProps: { RawData, url: "/api/test", parser },
    });

    act(() => {
      resolve({
        status: 401,
      } as Response);
    });

    await waitFor(() => expect(result.current).toEqual({ status: "error" }));

    expect(reload).toHaveBeenCalled();
  });

  test("handles a parsing error", async () => {
    const RawData = z.string();
    const parser = (s: String) => s;

    const { promise, resolve } = PromiseWithResolvers<Response>();

    jest.mocked(fetch).mockReturnValue(promise);

    const { result } = renderHook(useApiResult, {
      initialProps: { RawData, url: "/api/test", parser },
    });

    act(() => {
      resolve({
        status: 200,
        json: () =>
          new Promise((resolve) => {
            resolve({ data: 12 });
          }),
      } as Response);
    });

    await waitFor(() => expect(result.current).toEqual({ status: "error" }));
  });
});
