import { className } from "../../util/dom";
import { ReactElement, useId } from "react";

export const OperatorSelection = ({
  nfcSupported: nfcSupported,
}: {
  nfcSupported: boolean;
}): ReactElement => {
  const inputId = useId();

  return (
    <div className="flex flex-col content-stretch">
      {nfcSupported ?
        <NfcSupported />
      : <NfcUnsupported />}
      <Or />
      <label htmlFor={inputId}>Search for an Operator</label>
      <input id={inputId} />
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
