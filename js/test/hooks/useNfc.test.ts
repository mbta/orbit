import { useNfc } from "../../hooks/useNfc";
import { nfcSupported } from "../../util/nfc";
import { mockNDEFReader } from "../helpers/mockHelpers";
import { PromiseWithResolvers } from "../helpers/promiseWithResolvers";
import { act, renderHook, waitFor } from "@testing-library/react";

jest.mock("../../util/nfc.ts", () => ({
  __esModule: true,
  nfcSupported: jest.fn(() => true),
}));

describe("useNfc", () => {
  test("creates a reader and scans", () => {
    const { mockScan } = mockNDEFReader();

    const { result } = renderHook(useNfc);

    expect(mockScan).toHaveBeenCalledOnce();

    expect(result.current).toMatchObject({ result: { status: "reading" } });
  });

  test("handles a scan error", async () => {
    const { mockScan } = mockNDEFReader();

    const { promise: scanPromise, reject } = PromiseWithResolvers<undefined>();

    jest.mocked(mockScan).mockReturnValue(scanPromise);

    const { result } = renderHook(useNfc);

    act(() => {
      reject(new Error("test error"));
    });

    await waitFor(() => {
      expect(result.current).toMatchObject({
        result: {
          status: "error",
          error: new Error("test error"),
        },
      });
    });
  });

  test("handles a case where NFC is unsupported", () => {
    mockNDEFReader();

    jest.mocked(nfcSupported).mockReturnValueOnce(false);

    const { result } = renderHook(useNfc);

    expect(result.current).toMatchObject({
      result: { status: "nfcUnsupported" },
    });
  });

  test("handles a case where NFC becomes unsupported", () => {
    mockNDEFReader();

    const { result, rerender } = renderHook(useNfc);

    jest
      .mocked(nfcSupported)
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(false);

    expect(result.current).toMatchObject({ result: { status: "reading" } });

    // it takes a couple of rerenders for both useEffect hooks to update
    rerender();

    rerender();

    expect(result.current).toEqual({
      result: { status: "nfcUnsupported" },
      abortController: null,
    });
  });

  test("aborts the scan on unmount", () => {
    mockNDEFReader();

    const { result, unmount } = renderHook(useNfc);

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const abortSpy = jest.spyOn(result.current.abortController!, "abort");

    unmount();

    expect(abortSpy).toHaveBeenCalled();
  });

  test("can cancel the scan using the AbortController", async () => {
    mockNDEFReader();

    const { result } = renderHook(useNfc);

    act(() => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      result.current.abortController!.abort();
    });

    await waitFor(() => {
      expect(result.current).toMatchObject({ result: { status: "cancelled" } });
    });
  });
});
