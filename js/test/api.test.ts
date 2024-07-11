import { post, useApiResult } from "../api";
import { fetch, reload } from "../browser";
import { putMetaData } from "./helpers/metadata";
import { PromiseWithResolvers } from "./helpers/promiseWithResolvers";
import { act, renderHook, waitFor } from "@testing-library/react";
import { z } from "zod";

jest.mock("../browser", () => ({
  __esModule: true,
  fetch: jest.fn(),
  reload: jest.fn(),
}));

describe("post", () => {
  test("throws on non-existent csrf token", () => {
    expect(() => post("/not-a-real-endpoint", {})).toThrow();
  });

  test("calls fetch() to POST", async () => {
    putMetaData("csrf-token", "TEST-CSRF-TOKEN");

    await post("/not-a-real-endpoint", { strawberries: "tasty" });
    expect(fetch).toHaveBeenCalledWith("/not-a-real-endpoint", {
      body: JSON.stringify({ strawberries: "tasty" }),
      headers: {
        "content-type": "application/json",
        "x-csrf-token": "TEST-CSRF-TOKEN",
      },
      method: "post",
    });
  });
});

describe("useApiResult", () => {
  test("returns loading state", () => {
    const RawData = z.string();
    const parser = (s: string) => s;

    jest.mocked(fetch).mockReturnValue(new Promise(jest.fn()));

    const { result } = renderHook(useApiResult, {
      initialProps: { RawData, url: "/api/test", parser },
    });

    expect(result.current).toEqual({ status: "loading" });
  });

  test("handles success state", async () => {
    const RawData = z.string();
    const parser = (s: string) => s;

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

    await waitFor(() => {
      expect(result.current).toEqual({ status: "ok", result: "test" });
    });
  });

  test("reloads on a 401 response", async () => {
    const RawData = z.string();
    const parser = (s: string) => s;

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

    await waitFor(() => {
      expect(result.current).toMatchObject({ status: "error" });
    });

    expect(reload).toHaveBeenCalled();
  });

  test("throws on an unrecognized response code", async () => {
    const RawData = z.string();
    const parser = (s: string) => s;

    const { promise, resolve } = PromiseWithResolvers<Response>();

    jest.mocked(fetch).mockReturnValue(promise);

    const { result } = renderHook(useApiResult, {
      initialProps: { RawData, url: "/api/test", parser },
    });

    act(() => {
      resolve({
        status: 500,
      } as Response);
    });

    await waitFor(() => {
      expect(result.current).toEqual({
        status: "error",
        error: new Error("Unrecognized response code: 500"),
      });
    });
  });

  test("handles a parsing error", async () => {
    const RawData = z.string();
    const parser = (s: string) => s;

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

    await waitFor(() => {
      expect(result.current).toMatchObject({ status: "error" });
    });
  });
});
