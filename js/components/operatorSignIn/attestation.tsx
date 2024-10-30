import { ApiResult } from "../../api";
import { reload } from "../../browser";
import { lookupDisplayName } from "../../hooks/useEmployees";
import { Employee } from "../../models/employee";
import { className } from "../../util/dom";
import { removeLeadingZero } from "../../util/string";
import { useSignInText } from "./text";
import { ChangeEvent, ReactElement, useEffect, useState } from "react";

export const Attestation = ({
  badge,
  employees,
  onComplete,
  loading,
  prefill,
}: {
  badge: string;
  employees: ApiResult<Employee[]>;
  onComplete: (radio: string) => void;
  loading: boolean;
  prefill: boolean;
}): ReactElement => {
  const defaultValue = prefill ? badge : "";

  const [enteredBadge, setEnteredBadge] = useState<string>(defaultValue);
  const [enteredRadio, setEnteredRadio] = useState<string>("");
  const valid = enteredBadge === badge && enteredRadio !== "";

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
      <form
        onSubmit={(e) => {
          e.preventDefault();
        }}
      >
        <InputBox
          title={"Operator Badge Number"}
          defaultValue={defaultValue}
          onChange={(evt) => {
            setEnteredBadge(removeLeadingZero(evt.target.value));
          }}
        />
        <SignatureHint badge={badge} signatureText={enteredBadge} />
        <InputBox
          title={"Radio Number"}
          defaultValue={""}
          onChange={(evt) => {
            setEnteredRadio(evt.target.value);
          }}
        />
        <p className="my-3">
          By pressing the button below I, <b className="fs-mask">{name}</b>,
          confirm the above is true.
        </p>
        <button
          className={className([
            "block w-full md:max-w-64 mx-auto h-10 px-5 bg-gray-500 text-gray-200 rounded-md",
            (!valid || loading) && "opacity-50",
          ])}
          onClick={() => {
            onComplete(enteredRadio);
          }}
          disabled={!valid}
        >
          Complete Fit for Duty Check
        </button>
      </form>
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
        "fs-mask mt-2 h-6 overflow-y-hidden text-[12px] transition-[line-height] ease-out",
        hintClass,
      ])}
      title={title}
    >
      {hintText}
    </p>
  );
};

export const InputBox = ({
  onChange,
  defaultValue,
  title,
}: {
  onChange: (evt: ChangeEvent<HTMLInputElement>) => void;
  defaultValue: string;
  title: string;
}): ReactElement => {
  return (
    <div>
      <label className="text-sm">
        <span className="text-xs">{title}</span>
        <span className="float-right text-xxs font-semibold uppercase tracking-wide-4">
          Required
        </span>
        <input
          type="text"
          className="fs-mask w-full"
          inputMode="numeric"
          defaultValue={defaultValue}
          // Do not set `value`- we are transforming below!
          onChange={onChange}
          required
        />
      </label>
    </div>
  );
};
