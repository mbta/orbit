import { fetchEmployeeByBadgeSerial } from "../../hooks/useEmployees";
import { useNfc } from "../../hooks/useNfc";
import { className } from "../../util/dom";
import { removeLeadingZero } from "../../util/string";
import { BadgeEntry } from "./types";
import { ReactElement, useEffect, useId, useState } from "react";

export const OperatorSelection = ({
  nfcSupported: nfcSupported,
  onOK,
  onBadgeLookupError,
  onNfcScanError,
}: {
  nfcSupported: boolean;
  onOK: (badgeEntry: BadgeEntry) => void;
  onBadgeLookupError: () => void;
  onNfcScanError: () => void;
}): ReactElement => {
  const inputId = useId();
  const [badgeEntry, setBadgeEntry] = useState<BadgeEntry | null>(null);

  const { result: nfcResult } = useNfc();

  useEffect(() => {
    if (nfcResult.status === "success") {
      const badgeSerial = nfcResult.data;
      // TODO potential race condition if something changes before the fetch returns?
      // maybe not, cuz useNfc locks in the state on a scan result, but it should probably be defended against anyway
      fetchEmployeeByBadgeSerial(badgeSerial).then(
        (badge) => {
          onOK({ number: badge, method: "nfc" });
        },
        () => {
          onBadgeLookupError();
        },
      );
    } else if (nfcResult.status === "error") {
      onNfcScanError();
    }
  }, [nfcResult, onOK, onBadgeLookupError, onNfcScanError]);

  const buttonEnabled = badgeEntry !== null;

  return (
    <div className="flex flex-col content-stretch">
      {nfcSupported ?
        <NfcSupported />
      : <NfcUnsupported />}
      <Or />
      <label htmlFor={inputId}>Search for an Operator</label>
      <input
        className="fs-mask h-10"
        id={inputId}
        inputMode="numeric"
        onChange={(evt) => {
          setBadgeEntry({
            number: removeLeadingZero(evt.target.value),
            method: "manual",
          });
        }}
      />
      <button
        disabled={!buttonEnabled}
        onClick={() => {
          // This should never happen, but throw just in case.
          if (badgeEntry === null) {
            throw new Error(
              "operatorSelection badgeEntry was impossibly null.",
            );
          }

          onOK(badgeEntry);
        }}
        className={className([
          "rounded bg-gray-500 text-gray-200 mt-3 w-full md:max-w-64 mx-auto h-10",
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
  <div className="my-4 flex flex-col items-center gap-3 p-6 text-center bg-gray-200">
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
  <div className="my-4 flex flex-col items-center gap-3 p-5 text-center bg-gray-200">
    <p>
      Badge Tap is not supported on this device and/or browser. Please use an
      Orbit provided Android device and Google Chrome to use Badge Tap
      functionality.
    </p>
  </div>
);
