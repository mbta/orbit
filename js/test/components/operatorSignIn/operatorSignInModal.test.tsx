import { fetch } from "../../../browser";
import { OperatorSignInModal } from "../../../components/operatorSignIn/operatorSignInModal";
import { findEmployeeByBadgeSerial } from "../../../hooks/useEmployees";
import { useNfc } from "../../../hooks/useNfc";
import { nfcSupported } from "../../../util/nfc";
import { employeeFactory } from "../../helpers/factory";
import { putMetaData } from "../../helpers/metadata";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const EMPLOYEES = [employeeFactory.build()];
jest.mock("../../../hooks/useEmployees", () => ({
  useEmployees: jest.fn().mockImplementation(() => ({
    status: "ok",
    result: EMPLOYEES,
  })),
  findEmployeeByBadge: jest.fn(() => EMPLOYEES),
  findEmployeeByBadgeSerial: jest.fn(() => EMPLOYEES),
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

jest.mock("../../../browser", () => ({
  fetch: jest.fn(),
}));

describe("OperatorSignInModal", () => {
  test("shows badge tap message by default", () => {
    const view = render(<OperatorSignInModal />);

    expect(view.getByText(/waiting for badge tap/i)).toBeInTheDocument();
  });

  test("shows badge tap unsupported message when NFC isn't available", () => {
    jest.mocked(nfcSupported).mockReturnValueOnce(false);

    const view = render(<OperatorSignInModal />);

    expect(view.getByText(/badge tap is not supported/i)).toBeInTheDocument();
  });

  test("can close the modal", async () => {
    const view = render(<OperatorSignInModal />);

    await userEvent.click(view.getByRole("button", { name: "[x]" }));

    expect(view.queryByText(/fit for duty check/i)).not.toBeInTheDocument();
  });

  test("submits successful attestation to the server", async () => {
    putMetaData("csrf-token", "TEST-CSRF-TOKEN");
    jest.mocked(fetch).mockResolvedValueOnce({
      ok: true,
    } as Response);

    const view = render(<OperatorSignInModal />);
    await userEvent.type(view.getByRole("textbox"), "123");
    await userEvent.click(view.getByRole("button", { name: "OK" }));

    expect(view.getByText("Step 2 of 2")).toBeInTheDocument();
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

    const view = render(<OperatorSignInModal />);
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

  test("shows failure component when no operator is found after an NFC tap", () => {
    const view = render(<OperatorSignInModal />);

    jest.mocked(useNfc).mockReturnValue({
      result: { status: "success", data: "bad_serial" },
      abortController: new AbortController(),
    });
    jest.mocked(findEmployeeByBadgeSerial).mockReturnValueOnce(undefined);

    view.rerender(<OperatorSignInModal />);

    expect(
      view.getByText(/something went wrong when looking up the owner/i),
    ).toBeInTheDocument();
  });
});
