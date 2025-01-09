import { useNow } from "../../dateTime";
import { lookupDisplayName } from "../../hooks/useEmployees";
import { Certification, getExpired } from "../../models/certification";
import { Employee } from "../../models/employee";
import { className } from "../../util/dom";
import { removeLeadingZero } from "../../util/string";
import { Bypass, CertificateBoxes } from "./expiry";
import { useSignInText } from "./text";
import { ReactElement, useEffect, useState } from "react";

export const Attestation = ({
  badge,
  employees,
  certifications,
  onComplete,
  loading,
  prefill,
}: {
  badge: string;
  employees: Employee[];
  certifications: Certification[];
  onComplete: (radio: string) => void;
  loading: boolean;
  prefill: boolean;
}): ReactElement => {
  const defaultValue = prefill ? badge : "";
  const now = useNow("second");

  const [enteredBadge, setEnteredBadge] = useState<string>(defaultValue);
  const [enteredRadio, setEnteredRadio] = useState<string>("");
  const valid = enteredBadge === badge && enteredRadio !== "";
  const [bypass, setBypass] = useState<boolean>(false);

  const name = lookupDisplayName(badge, employees);
  const expireds = getExpired(certifications, now);

  return (
    <div className="text-sm">
      <CertificateBoxes
        certifications={certifications}
        displayName={name}
        ignoreExpired={bypass}
        now={now}
      />
      {expireds.length === 0 || bypass ?
        <>
          <SignInText />
          <form
            onSubmit={(e) => {
              e.preventDefault();
            }}
          >
            <InputBox
              title={"Operator Badge Number"}
              defaultValue={defaultValue}
              onChange={(value) => {
                setEnteredBadge(removeLeadingZero(value));
              }}
            />
            <SignatureHint badge={badge} signatureText={enteredBadge} />
            <InputBox
              title={"Radio Number"}
              defaultValue={""}
              onChange={(value) => {
                setEnteredRadio(value);
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
        </>
      : <>
          <ol className="m-8 mr-0 list-decimal">
            <li>Do not allow {name} to drive.</li>
            <li>Call the Office.</li>
            <li>Send {name} to the Supervisors&#39; Office.</li>
          </ol>
          <Bypass
            expireds={expireds}
            displayName={name}
            onContinue={function (): void {
              setBypass(true);
            }}
          />
        </>
      }
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

const InputBox = ({
  onChange,
  defaultValue,
  title,
}: {
  onChange: (value: string) => void;
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
          onChange={(evt) => {
            onChange(evt.target.value);
          }}
          required
        />
      </label>
    </div>
  );
};
