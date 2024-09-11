import { fetch } from "../../../browser";
import { OperatorSignInModal } from "../../../components/operatorSignIn/operatorSignInModal";
import { fetchEmployeeByBadgeSerial } from "../../../hooks/useEmployees";
import { useNfc } from "../../../hooks/useNfc";
import { nfcSupported } from "../../../util/nfc";
import { employeeFactory } from "../../helpers/factory";
import { putMetaData } from "../../helpers/metadata";
import {
  neverPromise,
  PromiseWithResolvers,
} from "../../helpers/promiseWithResolvers";
import { act, render, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const EMPLOYEES = [employeeFactory.build()];
// eslint-disable-next-line @typescript-eslint/no-unsafe-return
jest.mock("../../../hooks/useEmployees", () => ({
  ...jest.requireActual("../../../hooks/useEmployees"),
  useEmployees: jest.fn().mockImplementation(() => ({
    status: "ok",
    result: EMPLOYEES,
  })),
  findEmployeeByBadge: jest.fn(() => EMPLOYEES[0]),
  fetchEmployeeByBadgeSerial: jest.fn(() => neverPromise),
}));

jest.mock("../../../util/nfc", () => ({
  nfcSupported: jest.fn().mockReturnValue(true),
}));

jest.mock("../../../hooks/useNfc", () => ({
  useNfc: jest.fn().mockReturnValue({
    result: { status: "reading" },
    abortController: new AbortController(),
  }),
}));

describe("OperatorSignInModal", () => {
  test("shows badge tap message by default", () => {
    const view = render(<OperatorSignInModal show={true} close={jest.fn()} />);

    expect(view.getByText(/waiting for badge tap/i)).toBeInTheDocument();
  });

  test("shows badge tap unsupported message when NFC isn't available", () => {
    jest.mocked(nfcSupported).mockReturnValueOnce(false);

    const view = render(<OperatorSignInModal show={true} close={jest.fn()} />);

    expect(view.getByText(/badge tap is not supported/i)).toBeInTheDocument();
  });

  test("can close the modal", async () => {
    const close = jest.fn();
    const view = render(<OperatorSignInModal show={true} close={close} />);

    await userEvent.click(view.getByRole("button", { name: "[x]" }));
    expect(close).toHaveBeenCalled();
    view.rerender(<OperatorSignInModal show={false} close={close} />);

    expect(view.queryByText(/fit for duty check/i)).not.toBeInTheDocument();
  });

  test("submits successful attestation to the server", async () => {
    putMetaData("csrf-token", "TEST-CSRF-TOKEN");
    jest.mocked(fetch).mockResolvedValueOnce({
      ok: true,
    } as Response);

    const view = render(<OperatorSignInModal show={true} close={jest.fn()} />);
    await userEvent.type(view.getByRole("textbox"), "123");
    await userEvent.click(view.getByRole("button", { name: "OK" }));

    expect(view.getByText("Step 2 of 2")).toBeInTheDocument();
    expect(view.getByRole("textbox")).toHaveValue(""); // Not pre-filled if manually typed
    await userEvent.type(view.getByRole("textbox"), "123");
    await userEvent.click(
      view.getByRole("button", { name: "Complete Fit for Duty Check" }),
    );
    expect(view.getByText("signed in successfully")).toBeInTheDocument();
  });

  test("shows failure component on error", async () => {
    putMetaData("csrf-token", "TEST-CSRF-TOKEN");
    jest.spyOn(console, "error").mockImplementation(() => {});
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
    });

    const view = render(<OperatorSignInModal show={true} close={jest.fn()} />);
    await userEvent.type(view.getByRole("textbox"), "123");
    await userEvent.click(view.getByRole("button", { name: "OK" }));

    expect(view.getByText("Step 2 of 2")).toBeInTheDocument();
    await userEvent.type(view.getByRole("textbox"), "123");
    await userEvent.click(
      view.getByRole("button", { name: "Complete Fit for Duty Check" }),
    );
    expect(view.getByText("Something went wrong")).toBeInTheDocument();
    expect(console.error).toHaveBeenCalledOnce();
  });

  test("shows failure component when no operator is found after an NFC tap", async () => {
    const close = jest.fn();
    const view = render(<OperatorSignInModal show={true} close={jest.fn()} />);

    jest.mocked(useNfc).mockReturnValueOnce({
      result: { status: "success", data: "bad_serial" },
      abortController: new AbortController(),
    });
    const { promise, reject } = PromiseWithResolvers<string>();
    jest.mocked(fetchEmployeeByBadgeSerial).mockReturnValueOnce(promise);

    view.rerender(<OperatorSignInModal show={true} close={close} />);

    act(() => {
      reject(new Error("not found"));
    });

    await waitFor(() => {
      expect(
        view.getByText(/something went wrong when looking up the owner/i),
      ).toBeInTheDocument();
    });
  });

  test("shows failure component when NFC tap fails", () => {
    const close = jest.fn();
    const view = render(<OperatorSignInModal show={true} close={close} />);

    jest.mocked(useNfc).mockReturnValueOnce({
      result: { status: "error", error: "error" },
      abortController: new AbortController(),
    });

    view.rerender(<OperatorSignInModal show={true} close={close} />);

    expect(
      view.getByText(/something went wrong when looking for a badge tap/i),
    ).toBeInTheDocument();
  });

  test("reopening modal after a successful sign-in resets to the original state", async () => {
    putMetaData("csrf-token", "TEST-CSRF-TOKEN");
    jest.mocked(fetch).mockResolvedValueOnce({
      ok: true,
    } as Response);

    const close = jest.fn();

    const view = render(<OperatorSignInModal show={true} close={close} />);

    await userEvent.type(view.getByRole("textbox"), "123");

    await userEvent.click(view.getByRole("button", { name: "OK" }));

    await userEvent.type(view.getByRole("textbox"), "123");
    await userEvent.click(
      view.getByRole("button", { name: "Complete Fit for Duty Check" }),
    );

    expect(view.getByText(/signed in successfully/i)).toBeInTheDocument();

    view.rerender(<OperatorSignInModal show={false} close={close} />);

    view.rerender(<OperatorSignInModal show={true} close={close} />);

    expect(view.getByText(/waiting for badge tap/i)).toBeInTheDocument();
  });
});
