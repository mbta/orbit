import { ApiResult } from "../../api";
import { reload } from "../../browser";
import { findEmployeeByBadge } from "../../hooks/useEmployees";
import { Employee } from "../../models/employee";
import { className } from "../../util/dom";
import { useSignInText } from "./text";
import { ReactElement, useEffect, useState } from "react";

export const Attestation = ({
  badge,
  employees,
  onComplete,
  loading,
}: {
  badge: string;
  employees: ApiResult<Employee[]>;
  onComplete: () => void;
  loading: boolean;
}): ReactElement => {
  const [entered, setEntered] = useState<string>("");
  const ready = entered === badge;

  if (employees.status === "loading") {
    return <div>Loading...</div>;
  } else if (employees.status === "error") {
    return (
      <div className="text-center">
        <div className="mb-4">Unable to download employee data</div>
        <div>
          <button
            className="rounded bg-mbta-blue text-gray-200 w-1/4 max-w-20"
            onClick={reload}
          >
            Reload
          </button>
        </div>
      </div>
    );
  }
  const employee = findEmployeeByBadge(employees.result, badge);
  const name =
    employee !== undefined ?
      `${employee.preferred_first ?? employee.first_name} ${employee.last_name}`
    : `Operator #${badge}`;
  return (
    <div className="text-sm">
      Step 2 of 2
      <SignInText />
      <SignaturePrompt onChange={setEntered} />
      <SignatureHint badge={badge} signatureText={entered} />
      <p className="mx-4 my-8">
        By pressing the button below I, <b className="fs-mask">{name}</b>,
        confirm the above is true.
      </p>
      <button
        className={className([
          "block mx-auto w-2/3 max-w-80 h-10 bg-mbta-blue text-gray-200 rounded-md",
          (!ready || loading) && "opacity-50",
        ])}
        onClick={onComplete}
        disabled={!ready}
      >
        Complete Fit for Duty Check
      </button>
    </div>
  );
};

export const SignInText = (): ReactElement => {
  const signInText = useSignInText();
  return <div>{signInText.text}</div>;
};

const SignatureHint = ({
  badge,
  signatureText,
}: {
  badge: string;
  signatureText: string;
}): ReactElement => {
  type SignatureHint = "empty" | "bad" | "good";

  // We don't want to nag users about signatures while they're still typing.
  // As such, we only sometimes want the hint to reflect the current state.
  const [visibleHint, setVisibleHint] = useState<SignatureHint>("empty");
  useEffect(() => {
    let properHint: SignatureHint;
    if (signatureText === badge) {
      properHint = "good";
    } else if (signatureText !== "") {
      properHint = "bad";
    } else {
      properHint = "empty";
    }

    // If it hasn't changed, don't do anything.
    if (visibleHint === properHint) {
      return;
    }
    // If the transition is from empty to bad, let the user keep typing.
    if (visibleHint === "empty" && properHint === "bad") {
      const timeout = setTimeout(() => {
        setVisibleHint(properHint);
      }, 1000);
      return () => {
        clearTimeout(timeout);
      };
    }
    // Otherwise, update immediately.
    setVisibleHint(properHint);
  }, [signatureText, badge, visibleHint]);
  let hintText: string;
  let hintClass: string;
  let title: string | undefined;

  if (visibleHint === "good") {
    hintText = "Looks good!";
    hintClass = "text-green";
  } else if (visibleHint === "bad") {
    hintText = "That badge number doesn't match our records.";
    hintClass = "text-mbta-red";
    title = `expected "${badge}", got "${signatureText}"`;
  } else {
    hintText = "";
    hintClass = "leading-[0]";
  }

  return (
    <p
      className={className([
        "fs-mask mt-2 h-6 overflow-y-hidden text-sm transition-[line-height] ease-out",
        hintClass,
      ])}
      title={title}
    >
      {hintText}
    </p>
  );
};

export const SignaturePrompt = ({
  onChange,
}: {
  onChange: (value: string) => void;
}): ReactElement => {
  return (
    <div>
      <label className="text-sm font-semibold">
        <span className="text-xs font-semibold">Operator Badge Number</span>
        <span className="float-right text-xxs font-semibold uppercase tracking-wide-4">
          Required
        </span>
        <input
          type="text"
          className="w-full"
          inputMode="numeric"
          onChange={(evt) => {
            onChange(evt.target.value);
          }}
          required
        />
      </label>
    </div>
  );
};
