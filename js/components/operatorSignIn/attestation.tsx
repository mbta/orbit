import { ApiResult } from "../../api";
import { reload } from "../../browser";
import { lookupDisplayName } from "../../hooks/useEmployees";
import { Employee } from "../../models/employee";
import { className } from "../../util/dom";
import { useSignInText } from "./text";
import { ReactElement, useEffect, useState } from "react";

export const Attestation = ({
  badge,
  employees,
  onComplete,
  loading,
  prefill,
}: {
  badge: string;
  employees: ApiResult<Employee[]>;
  onComplete: () => void;
  loading: boolean;
  prefill: boolean;
}): ReactElement => {
  const defaultValue = prefill ? badge : "";

  const [entered, setEntered] = useState<string>(defaultValue);
  const ready = entered === badge;

  if (employees.status === "loading") {
    return <div>Loading...</div>;
  } else if (employees.status === "error") {
    return (
      <div className="text-center">
        <div className="mb-4">Unable to download employee data</div>
        <div>
          <button
            className="rounded bg-blue text-gray-200 w-1/4 max-w-20"
            onClick={reload}
          >
            Reload
          </button>
        </div>
      </div>
    );
  }
  const name = lookupDisplayName(badge, employees.result);
  return (
    <div className="text-sm">
      Step 2 of 2
      <SignInText />
      <SignaturePrompt defaultValue={defaultValue} onChange={setEntered} />
      <SignatureHint badge={badge} signatureText={entered} />
      <p className="my-3">
        By pressing the button below I, <b className="fs-mask">{name}</b>,
        confirm the above is true.
      </p>
      <button
        className={className([
          "block w-full md:max-w-64 mx-auto h-10 px-5 bg-gray-500 text-gray-200 rounded-md",
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
    hintClass = "text-red-200";
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
  defaultValue,
}: {
  onChange: (value: string) => void;
  defaultValue: string;
}): ReactElement => {
  return (
    <div>
      <label className="text-sm">
        <span className="text-xs">Operator Badge Number</span>
        <span className="float-right text-xxs font-semibold uppercase tracking-wide-4">
          Required
        </span>
        <input
          type="text"
          className="w-full"
          inputMode="numeric"
          defaultValue={defaultValue}
          onChange={(evt) => {
            onChange(evt.target.value);
          }}
          required
        />
      </label>
    </div>
  );
};
