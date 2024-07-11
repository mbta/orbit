import { fetch } from "../../../browser";
import { OperatorSignInModal } from "../../../components/operatorSignIn/operatorSignInModal";
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
  findEmployeeByBadge: () => EMPLOYEES,
}));

jest.mock("../../../browser", () => ({
  fetch: jest.fn(),
}));

describe("OperatorSignInModal", () => {
  test("shows badge tap message by default", () => {
    const view = render(<OperatorSignInModal />);

    expect(view.getByText(/waiting for badge tap/i)).toBeInTheDocument();
  });

  test("can close the modal", async () => {
    const view = render(<OperatorSignInModal />);

    await userEvent.click(view.getByRole("button", { name: "[x]" }));

    expect(view.queryByText(/fit for duty check/i)).not.toBeInTheDocument();
  });

  test("submits successful attestation to the server", async () => {
    putMetaData("csrf-token", "TEST-CSRF-TOKEN");
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
    });

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
  });
});
