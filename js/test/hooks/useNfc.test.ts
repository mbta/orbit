import { useNfc } from "../../hooks/useNfc";
import { mockNDEFReader } from "../helpers/mockHelpers";
import { PromiseWithResolvers } from "../helpers/promiseWithResolvers";
import { act, renderHook, waitFor } from "@testing-library/react";

describe("useNfc", () => {
  test("creates a reader and scans", () => {
    const { mockScan } = mockNDEFReader();

    const abortController = new AbortController();

    const { result } = renderHook(useNfc, { initialProps: abortController });

    expect(mockScan).toHaveBeenCalledOnce();

    expect(result.current).toEqual({ status: "reading" });
  });

  test("handles a scan error", async () => {
    const { mockScan } = mockNDEFReader();

    const abortController = new AbortController();

    const { promise: scanPromise, reject } = PromiseWithResolvers<undefined>();

    jest.mocked(mockScan).mockReturnValue(scanPromise);

    const { result } = renderHook(useNfc, {
      initialProps: abortController,
    });

    act(() => {
      reject(new Error("test error"));
    });

    await waitFor(() => {
      expect(result.current).toEqual({
        status: "error",
        error: new Error("test error"),
      });
    });
  });

  test("aborts the scan on unmount", () => {
    mockNDEFReader();

    const abortController = new AbortController();

    const abortSpy = jest.spyOn(abortController, "abort");

    const { unmount } = renderHook(useNfc, { initialProps: abortController });

    unmount();

    expect(abortSpy).toHaveBeenCalled();
  });

  test("can cancel the scan using the AbortController", async () => {
    mockNDEFReader();

    const abortController = new AbortController();

    const { result } = renderHook(useNfc, { initialProps: abortController });

    act(() => {
      abortController.abort();
    });

    await waitFor(() => {
      expect(result.current).toEqual({ status: "cancelled" });
    });
  });
});
