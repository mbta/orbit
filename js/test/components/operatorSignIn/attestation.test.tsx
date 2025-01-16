import { Attestation } from "../../../components/operatorSignIn/attestation";
import { Certification } from "../../../models/certification";
import { Employee } from "../../../models/employee";
import { certificationFactory, employeeFactory } from "../../helpers/factory";
import { act, render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DateTime } from "luxon";

const EMPLOYEES: Employee[] = [employeeFactory.build({ badge: "123" })];
const CERTIFICATIONS_NONE: Certification[] = [
  {
    expires: DateTime.fromISO("2030-01-01"),
    railLine: "blue",
    type: "rail",
  },
  {
    expires: DateTime.fromISO("2030-01-01"),
    railLine: "none",
    type: "right_of_way",
  },
];
const CERTIFICATIONS_ONE_EXPIRED: Certification[] = [
  certificationFactory.build(),
];

describe("Attestation", () => {
  test("displays sign-in text", () => {
    const view = render(
      <Attestation
        badge="123"
        prefill={false}
        onComplete={jest.fn()}
        loading={false}
        employees={EMPLOYEES}
        certifications={CERTIFICATIONS_NONE}
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
        certifications={CERTIFICATIONS_NONE}
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
        certifications={CERTIFICATIONS_NONE}
      />,
    );
    expect(view.getByText("Operator #00000000")).toBeInTheDocument();
  });

  describe("signature text box", () => {
    test("it pre-fills if requested", () => {
      const view = render(
        <Attestation
          badge="123"
          prefill={true}
          onComplete={jest.fn()}
          loading={false}
          employees={EMPLOYEES}
          certifications={CERTIFICATIONS_NONE}
        />,
      );
      const input = view.getByLabelText(/Operator Badge Number/i, {
        selector: "input",
      });
      expect(input).toHaveValue("123");
    });
  });

  describe("radio text box", () => {
    test("it's there", () => {
      const view = render(
        <Attestation
          badge="123"
          prefill={false}
          onComplete={jest.fn()}
          loading={false}
          employees={EMPLOYEES}
          certifications={CERTIFICATIONS_NONE}
        />,
      );
      const input = view.getByLabelText(/Radio Number/i, {
        selector: "input",
      });
      expect(input).toBeInTheDocument();
      expect(input).toHaveValue("");
    });
    test("cannot be blank", async () => {
      const onComplete = jest.fn();
      const view = render(
        <Attestation
          badge="123"
          prefill={false}
          onComplete={onComplete}
          loading={false}
          employees={EMPLOYEES}
          certifications={CERTIFICATIONS_NONE}
        />,
      );
      const badgeInput = view.getByLabelText(/Operator Badge Number/i, {
        selector: "input",
      });
      await userEvent.type(badgeInput, "123");
      // Leave radio field blank
      expect(
        view.getByRole("button", { name: "Complete Fit for Duty Check" }),
      ).toBeDisabled();
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
        certifications={CERTIFICATIONS_NONE}
      />,
    );
    expect(
      view.getByRole("button", { name: "Complete Fit for Duty Check" }),
    ).toBeInTheDocument();
  });

  test("valid attestation", async () => {
    const radioNumber = "22";
    const onComplete = jest.fn();
    const view = render(
      <Attestation
        badge="123"
        prefill={false}
        onComplete={onComplete}
        loading={false}
        employees={EMPLOYEES}
        certifications={CERTIFICATIONS_NONE}
      />,
    );
    const badgeInput = view.getByLabelText(/Operator Badge Number/i, {
      selector: "input",
    });
    const radioInput = view.getByLabelText(/Radio Number/i, {
      selector: "input",
    });
    await userEvent.type(badgeInput, "123");
    await userEvent.type(radioInput, radioNumber);
    expect(view.getByText("Looks good!")).toBeInTheDocument();

    await userEvent.click(
      view.getByRole("button", { name: "Complete Fit for Duty Check" }),
    );
    expect(onComplete).toHaveBeenCalledExactlyOnceWith(radioNumber);
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
        certifications={CERTIFICATIONS_NONE}
      />,
    );
    const badgeInput = view.getByLabelText(/Operator Badge Number/i, {
      selector: "input",
    });
    const radioInput = view.getByLabelText(/Radio Number/i, {
      selector: "input",
    });
    await userEvent.type(badgeInput, "0123");
    await userEvent.type(radioInput, "22");
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
        certifications={CERTIFICATIONS_NONE}
      />,
    );

    await user.type(
      view.getByLabelText(/Operator Badge Number/i, {
        selector: "input",
      }),
      "4123",
    );
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

  describe("expiry", () => {
    test("can bypass expired mode", async () => {
      const view = render(
        <Attestation
          badge="123"
          prefill={false}
          onComplete={jest.fn()}
          loading={false}
          employees={EMPLOYEES}
          certifications={CERTIFICATIONS_ONE_EXPIRED}
        />,
      );
      expect(view.getByText("Expired card")).toBeInTheDocument();
      await userEvent.click(
        view.getByRole("button", { name: "Continue to Fit for Duty Check →" }),
      );
      expect(
        view.getByRole("button", { name: "Complete Fit for Duty Check" }),
      ).toBeInTheDocument();
    });
  });
});
