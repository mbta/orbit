import { className } from "../../util/dom";
import { ReactElement } from "react";

export const Success = ({ name }: { name: string }): ReactElement => {
  return (
    <div className="text-center text-4xl w-full block mt-5 p-10">
      ✅
      <div className="text-[20px]">
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
        ❌<div className="text-[20px]">Something went wrong</div>
      </div>
      <div className="w-full">
        <button
          className={className([
            "w-full max-w-64 block mx-auto rounded-md bg-gray-500 text-gray-200 text-sm p-1 h-10",
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
