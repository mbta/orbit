import { OperatorSelection } from "../../../components/operatorSignIn/operatorSelection";
import { fetchEmployeeByBadgeSerial } from "../../../hooks/useEmployees";
import { useNfc } from "../../../hooks/useNfc";
import {
  neverPromise,
  PromiseWithResolvers,
} from "../../helpers/promiseWithResolvers";
import { act, render, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

jest.mock("../../../hooks/useNfc", () => ({
  __esModule: true,
  useNfc: jest.fn().mockReturnValue({
    result: { status: "reading" },
    abortController: new AbortController(),
  }),
}));

jest.mock("../../../hooks/useEmployees", () => ({
  fetchEmployeeByBadgeSerial: jest.fn(() => neverPromise),
}));

describe("OperatorSelection", () => {
  test("displays NFC badge tap placeholder when NFC is supported", () => {
    const view = render(
      <OperatorSelection
        onOK={jest.fn()}
        onBadgeLookupError={jest.fn()}
        onNfcScanError={jest.fn()}
        nfcSupported={true}
      />,
    );

    expect(view.getByText(/waiting for badge tap/i)).toBeInTheDocument();
  });

  test("displays message when NFC is not supported", () => {
    const view = render(
      <OperatorSelection
        onOK={jest.fn()}
        onBadgeLookupError={jest.fn()}
        onNfcScanError={jest.fn()}
        nfcSupported={false}
      />,
    );

    expect(
      view.getByText(/badge tap is not supported on this device/i),
    ).toBeInTheDocument();
  });

  test("has an input for operator search", () => {
    const view = render(
      <OperatorSelection
        onOK={jest.fn()}
        onBadgeLookupError={jest.fn()}
        onNfcScanError={jest.fn()}
        nfcSupported={true}
      />,
    );

    expect(
      view.getByRole("textbox", { name: /search for an operator/i }),
    ).toBeInTheDocument();
  });

  test("executes onOK when OK button is clicked", async () => {
    const onOK = jest.fn();
    const view = render(
      <OperatorSelection
        onOK={onOK}
        onBadgeLookupError={jest.fn()}
        onNfcScanError={jest.fn()}
        nfcSupported={true}
      />,
    );

    const textField = view.getByRole("textbox");
    const button = view.getByRole("button");
    await userEvent.type(textField, "123");
    await userEvent.click(button);

    expect(onOK).toHaveBeenCalledExactlyOnceWith({
      number: "123",
      method: "manual",
    });
  });

  test("trims leading zeros from typed operator badge", async () => {
    const onOK = jest.fn();
    const view = render(
      <OperatorSelection
        onOK={onOK}
        onBadgeLookupError={jest.fn()}
        onNfcScanError={jest.fn()}
        nfcSupported={true}
      />,
    );

    const textField = view.getByRole("textbox");
    const button = view.getByRole("button");
    await userEvent.type(textField, "0123");
    await userEvent.click(button);

    expect(onOK).toHaveBeenCalledExactlyOnceWith({
      number: "123",
      method: "manual",
    });
  });

  test("executes onOK on successful badge tap", async () => {
    const onOK = jest.fn();
    const onBadgeLookupError = jest.fn();

    const { rerender } = render(
      <OperatorSelection
        onOK={onOK}
        onBadgeLookupError={onBadgeLookupError}
        onNfcScanError={jest.fn()}
        nfcSupported={true}
      />,
    );

    jest.mocked(useNfc).mockReturnValueOnce({
      result: { status: "success", data: "56" },
      abortController: new AbortController(),
    });
    const { promise, resolve } = PromiseWithResolvers<string>();
    jest.mocked(fetchEmployeeByBadgeSerial).mockReturnValueOnce(promise);

    rerender(
      <OperatorSelection
        onOK={onOK}
        onBadgeLookupError={onBadgeLookupError}
        onNfcScanError={jest.fn()}
        nfcSupported={true}
      />,
    );

    act(() => {
      resolve("123");
    });

    await waitFor(() => {
      expect(onOK).toHaveBeenCalledExactlyOnceWith({
        number: "123",
        method: "nfc",
      });
    });
  });

  test("executes onBadgeLookupError on unsuccessful badge tap result lookup", async () => {
    const onOK = jest.fn();
    const onBadgeLookupError = jest.fn();

    const { rerender } = render(
      <OperatorSelection
        onOK={onOK}
        onBadgeLookupError={onBadgeLookupError}
        onNfcScanError={jest.fn()}
        nfcSupported={true}
      />,
    );

    jest.mocked(useNfc).mockReturnValueOnce({
      result: { status: "success", data: "56" },
      abortController: new AbortController(),
    });
    const { promise, reject } = PromiseWithResolvers<string>();
    jest.mocked(fetchEmployeeByBadgeSerial).mockReturnValueOnce(promise);

    rerender(
      <OperatorSelection
        onOK={onOK}
        onBadgeLookupError={onBadgeLookupError}
        onNfcScanError={jest.fn()}
        nfcSupported={true}
      />,
    );

    act(() => {
      reject(new Error("404"));
    });

    await waitFor(() => {
      expect(onBadgeLookupError).toHaveBeenCalledOnce();
    });
    expect(onOK).not.toHaveBeenCalled();
  });

  test("executes onNfcScanError on unsuccessful badge tap", () => {
    const onOK = jest.fn();
    const onBadgeLookupError = jest.fn();
    const onNfcScanError = jest.fn();

    const { rerender } = render(
      <OperatorSelection
        onOK={onOK}
        onBadgeLookupError={onBadgeLookupError}
        onNfcScanError={onNfcScanError}
        nfcSupported={true}
      />,
    );

    jest.mocked(useNfc).mockReturnValueOnce({
      result: { status: "error", error: "error" },
      abortController: new AbortController(),
    });

    rerender(
      <OperatorSelection
        onOK={onOK}
        onBadgeLookupError={onBadgeLookupError}
        onNfcScanError={onNfcScanError}
        nfcSupported={true}
      />,
    );

    expect(onNfcScanError).toHaveBeenCalledOnce();
    expect(onOK).not.toHaveBeenCalled();
  });
});
