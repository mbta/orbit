import { OperatorSignInModal } from "../../../components/operatorSignIn/operatorSignInModal";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

describe("OperatorSignInModal", () => {
  test("shows badge tap message by default", () => {
    const view = render(<OperatorSignInModal />);

    expect(view.getByText(/waiting for badge tap/i)).toBeInTheDocument();
  });

  test("can close the modal", async () => {
    const view = render(<OperatorSignInModal />);

    await userEvent.click(view.getByRole("button"));

    expect(view.queryByText(/fit for duty check/i)).not.toBeInTheDocument();
  });
});
