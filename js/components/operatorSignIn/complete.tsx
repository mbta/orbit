import { className } from "../../util/dom";
import { ReactElement } from "react";

export const Success = ({ name }: { name: string }): ReactElement => {
  throw new Error("Preston test throw!");

  return (
    <div className="text-center text-4xl w-full block mt-5 p-10">
      ✅
      <div>
        <span className="fs-mask">{name}</span> signed in successfully
      </div>
    </div>
  );
};

export const SignInError = ({
  name,
  onTryAgain,
  loading,
}: {
  name: string;
  onTryAgain: () => void;
  loading: boolean;
}): ReactElement => {
  return (
    <>
      <div className="text-center text-4xl w-full mt-10 mb-10">
        ❌<div>Something went wrong</div>
      </div>
      <div className="w-full">
        <button
          className={className([
            "w-1/2 block mx-auto rounded-md bg-mbta-blue text-gray-100 text-sm p-2",
            loading && "opacity-50",
          ])}
          onClick={onTryAgain}
        >
          Try signing in <span className="fs-mask">{name}</span> again
        </button>
      </div>
    </>
  );
};

export const BadgeSerialLookupError = (): ReactElement => (
  <div className="text-center text-4xl w-full mt-10 mb-10">
    ⚠️
    <div>
      Something went wrong when looking up the owner of the tapped badge.
    </div>
  </div>
);

export const NfcScanError = (): ReactElement => (
  <div className="text-center text-4xl w-full mt-10 mb-10">
    ⚠️
    <div>Something went wrong when looking for a badge tap.</div>
  </div>
);
