import { OperatorSelection } from "../../../components/operatorSignIn/operatorSelection";
import { render } from "@testing-library/react";

describe("OperatorSelection", () => {
  test("displays NFC badge tap placeholder when NFC is supported", () => {
    const view = render(<OperatorSelection nfcSupported={true} />);

    expect(view.getByText(/waiting for badge tap/i)).toBeInTheDocument();
  });

  test("displays message when NFC is not supported", () => {
    const view = render(<OperatorSelection nfcSupported={false} />);

    expect(
      view.getByText(/badge tap is not supported on this device/i),
    ).toBeInTheDocument();
  });

  test("has an input for operator search", () => {
    const view = render(<OperatorSelection nfcSupported={true} />);

    expect(
      view.getByRole("textbox", { name: /search for an operator/i }),
    ).toBeInTheDocument();
  });
});
