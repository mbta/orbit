import { ApiResult } from "../../../api";
import { Attestation } from "../../../components/operatorSignIn/attestation";
import { Employee } from "../../../models/employee";
import { employeeFactory } from "../../helpers/factory";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const EMPLOYEES: ApiResult<Employee[]> = {
  status: "ok",
  result: [employeeFactory.build({ badge: "123" })],
};

describe("Attestation", () => {
  test("displays sign-in text", () => {
    const view = render(
      <Attestation badge="123" onComplete={jest.fn()} employees={EMPLOYEES} />,
    );
    expect(
      view.getByText("I do not have an electronic device in my possession."),
    ).toBeInTheDocument();
  });

  test("refers to operators by preferred first name (if available)", () => {
    const view = render(
      <Attestation badge="123" onComplete={jest.fn()} employees={EMPLOYEES} />,
    );
    expect(view.getByText("Preferredy Lasty")).toBeInTheDocument();
  });

  test("refers to operators by Operator #XXXX if name not available", () => {
    const view = render(
      <Attestation
        badge="00000000"
        onComplete={jest.fn()}
        employees={EMPLOYEES}
      />,
    );
    expect(view.getByText("Operator #00000000")).toBeInTheDocument();
  });

  test("contains signature text box", () => {
    const view = render(
      <Attestation badge="123" onComplete={jest.fn()} employees={EMPLOYEES} />,
    );
    expect(view.getByRole("textbox")).toBeInTheDocument();
  });

  test("contains Complete button", () => {
    const view = render(
      <Attestation badge="123" onComplete={jest.fn()} employees={EMPLOYEES} />,
    );
    expect(
      view.getByRole("button", { name: "Complete Fit for Duty Check" }),
    ).toBeInTheDocument();
  });

  test("executes onComplete function on button click", async () => {
    const onComplete = jest.fn();
    const view = render(
      <Attestation badge="123" onComplete={onComplete} employees={EMPLOYEES} />,
    );
    await userEvent.click(
      view.getByRole("button", { name: "Complete Fit for Duty Check" }),
    );
    expect(onComplete).toHaveBeenCalledOnce();
  });
});
