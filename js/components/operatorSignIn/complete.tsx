import { className } from "../../util/dom";
import { ReactElement } from "react";

export const Success = ({ name }: { name: string }): ReactElement => {
  return (
    <div className="text-center text-4xl w-full block mt-5 p-10">
      ✅<div>{name} signed in successfully</div>
    </div>
  );
};

export const Error = ({
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
          Try signing in {name} again
        </button>
      </div>
    </>
  );
};
