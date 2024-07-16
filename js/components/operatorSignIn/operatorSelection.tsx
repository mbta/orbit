import { ApiResult } from "../../api";
import { findEmployeeByBadgeSerial } from "../../hooks/useEmployees";
import { useNfc } from "../../hooks/useNfc";
import { Employee } from "../../models/employee";
import { className } from "../../util/dom";
import { ReactElement, useEffect, useId, useState } from "react";

export const OperatorSelection = ({
  nfcSupported: nfcSupported,
  onOK,
  employees,
}: {
  nfcSupported: boolean;
  onOK: (badge: string) => void;
  employees: ApiResult<Employee[]>;
}): ReactElement => {
  const inputId = useId();
  const [badgeEntry, setBadgeEntry] = useState<string>("");

  const nfcAbortController = new AbortController();
  const { result: nfcResult } = useNfc(nfcAbortController);

  useEffect(() => {
    if (nfcResult.status === "success" && employees.status === "ok") {
      const badge = findEmployeeByBadgeSerial(
        employees.result,
        nfcResult.data,
      )?.badge;

      if (badge) {
        onOK(badge);
      } else {
        // handle case where we can't find operator for badge
      }
    }
  }, [nfcResult, employees, onOK]);

  const buttonEnabled = badgeEntry !== "";

  return (
    <div className="flex flex-col content-stretch">
      {nfcSupported ?
        <NfcSupported />
      : <NfcUnsupported />}
      <Or />
      <label htmlFor={inputId}>Search for an Operator</label>
      <input
        id={inputId}
        onChange={(evt) => {
          setBadgeEntry(evt.target.value);
        }}
      />
      <button
        disabled={!buttonEnabled}
        onClick={() => {
          onOK(badgeEntry);
        }}
        className={className([
          "rounded bg-mbta-blue text-gray-200 mt-3 w-1/4 mx-auto",
          !buttonEnabled && "opacity-50",
        ])}
      >
        OK
      </button>
    </div>
  );
};

const Or = (): ReactElement => {
  const hrule = className([
    "flex-auto translate-y-1/2 border-0 border-t border-solid border-gray-200",
  ]);
  return (
    <div className="flex">
      <div className={hrule} />
      <p className="m-2 text-sm uppercase">or</p>
      <div className={hrule} />
    </div>
  );
};

const NfcSupported = (): ReactElement => (
  <div className="my-4 flex flex-col items-center gap-3 p-6 text-center bg-gray-100">
    <NfcSpinner />
    <p>Waiting for badge tap&hellip;</p>
  </div>
);

const NfcSpinner = (): ReactElement => {
  const circle = className([
    "origin-center fill-none stroke-gray-300 stroke-[2px] [stroke-dasharray:0.75_0.25]",
  ]);
  return (
    <svg viewBox="0 0 32 32" className="relative h-8 w-8">
      <circle
        cx="16"
        cy="16"
        r="14"
        pathLength="1"
        className={className([circle, "animate-dash-spin-ccw"])}
      />
      <circle
        cx="16"
        cy="16"
        r="8"
        pathLength="1"
        className={className([circle, "animate-dash-spin-cw"])}
      />
    </svg>
  );
};

const NfcUnsupported = (): ReactElement => (
  <div className="my-4 flex flex-col items-center gap-3 p-6 text-center bg-gray-200">
    <p>
      Badge Tap is not supported on this device and/or browser. Please use an
      Orbit provided Android device and Google Chrome to use Badge Tap
      functionality.
    </p>
  </div>
);
