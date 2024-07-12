import { ApiResult } from "../../../api";
import { OperatorSelection } from "../../../components/operatorSignIn/operatorSelection";
import { useNfc } from "../../../hooks/useNfc";
import { Employee } from "../../../models/employee";
import { employeeFactory } from "../../helpers/factory";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const EMPLOYEES: ApiResult<Employee[]> = {
  status: "ok",
  result: [employeeFactory.build({ badge: "123", badge_serials: ["56"] })],
};

jest.mock("../../../hooks/useNfc", () => ({
  __esModule: true,
  useNfc: jest.fn().mockReturnValue({ status: "reading" }),
}));

describe("OperatorSelection", () => {
  test("displays NFC badge tap placeholder when NFC is supported", () => {
    const view = render(
      <OperatorSelection
        onOK={jest.fn()}
        nfcSupported={true}
        employees={EMPLOYEES}
      />,
    );

    expect(view.getByText(/waiting for badge tap/i)).toBeInTheDocument();
  });

  test("displays message when NFC is not supported", () => {
    const view = render(
      <OperatorSelection
        onOK={jest.fn()}
        nfcSupported={false}
        employees={EMPLOYEES}
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
        nfcSupported={true}
        employees={EMPLOYEES}
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
        nfcSupported={true}
        employees={EMPLOYEES}
      />,
    );

    const textField = view.getByRole("textbox");
    const button = view.getByRole("button");
    await userEvent.type(textField, "123");
    await userEvent.click(button);

    expect(onOK).toHaveBeenCalledExactlyOnceWith("123");
  });

  test("executes onOK on successful badge tap", () => {
    const onOK = jest.fn();

    const { rerender } = render(
      <OperatorSelection
        onOK={onOK}
        nfcSupported={true}
        employees={EMPLOYEES}
      />,
    );

    jest.mocked(useNfc).mockReturnValueOnce({ status: "success", data: "56" });

    rerender(
      <OperatorSelection
        onOK={onOK}
        nfcSupported={true}
        employees={EMPLOYEES}
      />,
    );

    expect(onOK).toHaveBeenCalledExactlyOnceWith("123");
  });
});
