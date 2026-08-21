export type BranchPickerSelection = "Alewife" | "Ashmont" | "Braintree";

export const BranchPicker = ({
  setBranchPickerSelection,
}: {
  setBranchPickerSelection: (selection: BranchPickerSelection) => void;
}) => {
  return (
    <div className="flex h-14 justify-center max-w-96 self-center gap-1 w-80">
      <button
        className="flex flex-col justify-center items-center grow"
        onClick={() => {
          setBranchPickerSelection("Alewife");
        }}
      >
        <div>Alewife</div>
        <div>&middot;</div>
      </button>
      <button
        className="flex flex-col justify-center items-center grow"
        onClick={() => {
          setBranchPickerSelection("Ashmont");
        }}
      >
        <div>Ashmont</div>
        <div>&middot;</div>
      </button>
      <button
        className="flex flex-col justify-center items-center grow"
        onClick={() => {
          setBranchPickerSelection("Braintree");
        }}
      >
        <div>Braintree</div>
        <div>&middot;</div>
      </button>
    </div>
  );
};
