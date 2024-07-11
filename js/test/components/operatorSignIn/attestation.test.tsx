import { Attestation } from "../../../components/operatorSignIn/attestation";
import { employeeFactory } from "../../helpers/factory";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

jest.mock("../../../hooks/useEmployees.ts", () => ({
  __esModule: true,
  findEmployeeByBadge: jest.fn((_employees, badge) => {
    if (badge === "123") {
      return employeeFactory.build();
    }
    return undefined;
  }),
  useEmployees: jest.fn(() => ({
    status: "ok",
    result: [],
  })),
}));

describe("Attestation", () => {
  test("displays sign-in text", () => {
    const view = render(<Attestation badge="123" onComplete={jest.fn()} />);
    expect(
      view.getByText("I do not have an electronic device in my possession."),
    ).toBeInTheDocument();
  });

  test("refers to operators by preferred first name (if available)", () => {
    const view = render(<Attestation badge="123" onComplete={jest.fn()} />);
    expect(view.getByText("Preferredy Lasty")).toBeInTheDocument();
  });

  test("refers to operators by Operator #XXXX if name not available", () => {
    const view = render(
      <Attestation badge="00000000" onComplete={jest.fn()} />,
    );
    expect(view.getByText("Operator #00000000")).toBeInTheDocument();
  });

  test("contains signature text box", () => {
    const view = render(<Attestation badge="123" onComplete={jest.fn()} />);
    expect(view.getByRole("textbox")).toBeInTheDocument();
  });

  test("contains Complete button", () => {
    const view = render(<Attestation badge="123" onComplete={jest.fn()} />);
    expect(
      view.getByRole("button", { name: "Complete Fit for Duty Check" }),
    ).toBeInTheDocument();
  });

  test("executes onComplete function on button click", async () => {
    const onComplete = jest.fn();
    const view = render(<Attestation badge="123" onComplete={onComplete} />);
    await userEvent.click(
      view.getByRole("button", { name: "Complete Fit for Duty Check" }),
    );
    expect(onComplete).toHaveBeenCalledOnce();
  });
});
