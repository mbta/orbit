import { OperatorSignInModal } from "../../../components/operatorSignIn/operatorSignInModal";
import { nfcSupported } from "../../../util/nfc";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

jest.mock("../../../util/nfc", () => ({
  __esModule: true,
  nfcSupported: jest.fn().mockReturnValue(true),
}));

jest.mock("../../../hooks/useNfc", () => ({
  __esModule: true,
  useNfc: jest.fn().mockReturnValue({ status: "reading" }),
}));

jest.mock("../../../hooks/useEmployees", () => ({
  __esModule: true,
  useEmployees: jest.fn().mockReturnValue({ status: "loading" }),
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
});
