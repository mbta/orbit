import { OperatorSelection } from "../../../components/operatorSignIn/operatorSelection";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

describe("OperatorSelection", () => {
  test("displays NFC badge tap placeholder when NFC is supported", () => {
    const view = render(
      <OperatorSelection onOK={jest.fn()} nfcSupported={true} />,
    );

    expect(view.getByText(/waiting for badge tap/i)).toBeInTheDocument();
  });

  test("displays message when NFC is not supported", () => {
    const view = render(
      <OperatorSelection onOK={jest.fn()} nfcSupported={false} />,
    );

    expect(
      view.getByText(/badge tap is not supported on this device/i),
    ).toBeInTheDocument();
  });

  test("has an input for operator search", () => {
    const view = render(
      <OperatorSelection onOK={jest.fn()} nfcSupported={true} />,
    );

    expect(
      view.getByRole("textbox", { name: /search for an operator/i }),
    ).toBeInTheDocument();
  });

  test("executes onOK when OK button is clicked", async () => {
    const onOK = jest.fn();
    const view = render(<OperatorSelection onOK={onOK} nfcSupported={true} />);

    const textField = view.getByRole("textbox");
    const button = view.getByRole("button");
    await userEvent.type(textField, "123");
    await userEvent.click(button);

    expect(onOK).toHaveBeenCalledExactlyOnceWith("123");
  });
});
