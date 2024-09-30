import { ApiResult } from "../../../api";
import { Attestation } from "../../../components/operatorSignIn/attestation";
import { Employee } from "../../../models/employee";
import { employeeFactory } from "../../helpers/factory";
import { act, render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const EMPLOYEES: ApiResult<Employee[]> = {
  status: "ok",
  result: [employeeFactory.build({ badge: "123" })],
};

describe("Attestation", () => {
  test("displays sign-in text", () => {
    const view = render(
      <Attestation
        badge="123"
        prefill={false}
        onComplete={jest.fn()}
        loading={false}
        employees={EMPLOYEES}
      />,
    );
    expect(
      view.getByText("I do not have an electronic device in my possession."),
    ).toBeInTheDocument();
  });

  test("refers to operators by preferred first name (if available)", () => {
    const view = render(
      <Attestation
        badge="123"
        prefill={false}
        onComplete={jest.fn()}
        loading={false}
        employees={EMPLOYEES}
      />,
    );
    expect(view.getByText("Preferredy Lasty")).toBeInTheDocument();
  });

  test("refers to operators by Operator #XXXX if name not available", () => {
    const view = render(
      <Attestation
        badge="00000000"
        prefill={false}
        onComplete={jest.fn()}
        loading={false}
        employees={EMPLOYEES}
      />,
    );
    expect(view.getByText("Operator #00000000")).toBeInTheDocument();
  });

  describe("signature text box", () => {
    test("it's there", () => {
      const view = render(
        <Attestation
          badge="123"
          prefill={false}
          onComplete={jest.fn()}
          loading={false}
          employees={EMPLOYEES}
        />,
      );
      expect(view.getByRole("textbox")).toBeInTheDocument();
      expect(view.getByRole("textbox")).toHaveValue("");
    });

    test("it pre-fills if requested", () => {
      const view = render(
        <Attestation
          badge="123"
          prefill={true}
          onComplete={jest.fn()}
          loading={false}
          employees={EMPLOYEES}
        />,
      );
      expect(view.getByRole("textbox")).toHaveValue("123");
    });
  });

  test("contains Complete button", () => {
    const view = render(
      <Attestation
        badge="123"
        prefill={false}
        onComplete={jest.fn()}
        loading={false}
        employees={EMPLOYEES}
      />,
    );
    expect(
      view.getByRole("button", { name: "Complete Fit for Duty Check" }),
    ).toBeInTheDocument();
  });

  test("valid attestation", async () => {
    const onComplete = jest.fn();
    const view = render(
      <Attestation
        badge="123"
        prefill={false}
        onComplete={onComplete}
        loading={false}
        employees={EMPLOYEES}
      />,
    );
    await userEvent.type(view.getByRole("textbox"), "123");
    expect(view.getByText("Looks good!")).toBeInTheDocument();

    await userEvent.click(
      view.getByRole("button", { name: "Complete Fit for Duty Check" }),
    );
    expect(onComplete).toHaveBeenCalledOnce();
  });

  test("valid attestation with leading zero", async () => {
    const onComplete = jest.fn();
    const view = render(
      <Attestation
        badge="123"
        prefill={false}
        onComplete={onComplete}
        loading={false}
        employees={EMPLOYEES}
      />,
    );
    await userEvent.type(view.getByRole("textbox"), "0123");
    expect(view.getByText("Looks good!")).toBeInTheDocument();

    await userEvent.click(
      view.getByRole("button", { name: "Complete Fit for Duty Check" }),
    );
    expect(onComplete).toHaveBeenCalledOnce();
  });

  test("invalid attestation", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    jest.useFakeTimers();
    const onComplete = jest.fn();
    const view = render(
      <Attestation
        badge="123"
        prefill={false}
        onComplete={onComplete}
        loading={false}
        employees={EMPLOYEES}
      />,
    );

    await user.type(view.getByRole("textbox"), "4123");
    act(() => {
      jest.runAllTimers();
    });

    expect(view.queryByText("Looks good!")).not.toBeInTheDocument();
    expect(
      view.getByText("That badge number doesn't match our records."),
    ).toBeInTheDocument();

    // Try to click the button- it's disabled!
    await user.click(
      view.getByRole("button", { name: "Complete Fit for Duty Check" }),
    );

    expect(onComplete).not.toHaveBeenCalled();
    jest.useRealTimers();
  });
});
