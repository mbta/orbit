import { ApiResult } from "../../api";
import { findEmployeeByBadge } from "../../hooks/useEmployees";
import { Employee } from "../../models/employee";
import { useSignInText } from "./text";
import { ReactElement } from "react";

export const Attestation = ({
  badge,
  onComplete,
  employees,
}: {
  badge: string;
  onComplete: () => void;
  employees: ApiResult<Employee[]>;
}): ReactElement => {
  if (employees.status === "loading") {
    return <div>Loading...</div>;
  } else if (employees.status === "error") {
    return <div>Unable to download employee data. Please try again.</div>;
  }
  const employee = findEmployeeByBadge(employees.result, badge);
  const name =
    employee !== undefined ?
      `${employee.preferred_first ?? employee.first_name} ${employee.last_name}`
    : `Operator #${badge}`;
  return (
    <>
      Step 2 of 2
      <SignInText />
      <SignaturePrompt name={name} />
      <button
        className="w-full bg-mbta-blue text-gray-100 rounded-md mb-4"
        onClick={onComplete}
      >
        Complete Fit for Duty Check
      </button>
    </>
  );
};

export const SignInText = (): ReactElement => {
  const signInText = useSignInText();
  return <div>{signInText.text}</div>;
};

export const SignaturePrompt = ({ name }: { name: string }): ReactElement => {
  return (
    <div>
      <label className="text-sm font-semibold">
        <span className="text-xs font-semibold">Operator Badge Number</span>
        <span className="absolute right-1 text-xxs font-semibold uppercase tracking-wide-4">
          Required
        </span>
        <input type="text" className="w-full" inputMode="numeric" required />
      </label>
      <p className="mx-4 my-8">
        By pressing the button below I, <b className="fs-mask">{name}</b>,
        confirm the above is true.
      </p>
    </div>
  );
};
