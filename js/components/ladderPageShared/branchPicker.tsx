export type BranchPickerSelection = "Alewife" | "Ashmont" | "Braintree";

const defaultBg =
  "bg-[rgb(var(--ladder-branch-picker-background-dark))] light:bg-[rgb(var(--ladder-branch-picker-background-light))]";

const activeText =
  "text-[rgb(var(--ladder-branch-picker-background-dark))] light:text-[rgb(var(--ladder-branch-picker-background-light))]";

const branchColors: Record<
  BranchPickerSelection,
  { bg: string; dotText: string }
> = {
  Alewife: { bg: "bg-glides-gray-400", dotText: "text-glides-gray-400" },
  Ashmont: {
    bg: "bg-heavy-rail-ashmont",
    dotText: "text-heavy-rail-ashmont",
  },
  Braintree: {
    bg: "bg-heavy-rail-braintree",
    dotText: "text-heavy-rail-braintree",
  },
};

const BranchButton = ({
  branch,
  isActive,
  onClick,
}: {
  branch: BranchPickerSelection;
  isActive: boolean;
  onClick: () => void;
}) => {
  const { bg, dotText } = branchColors[branch];
  const buttonBg = isActive ? bg : defaultBg;
  const labelText = isActive ? activeText : "text-white";
  const dotColor = isActive ? activeText : dotText;

  return (
    <button
      className={`flex flex-col justify-center items-center grow ${buttonBg} rounded-t`}
      onClick={onClick}
    >
      <div className={labelText}>{branch}</div>
      <div className={`w-2 h-2 rounded-full bg-current ${dotColor}`} />
    </button>
  );
};

export const BranchPicker = ({
  branchPickerSelection,
  setBranchPickerSelection,
}: {
  branchPickerSelection: BranchPickerSelection;
  setBranchPickerSelection: (selection: BranchPickerSelection) => void;
}) => {
  return (
    <div className="flex justify-between h-14 self-center gap-1 w-full max-w-[371px]">
      {(["Alewife", "Ashmont", "Braintree"] as const).map((branch) => (
        <BranchButton
          key={branch}
          branch={branch}
          isActive={branchPickerSelection === branch}
          onClick={() => {
            setBranchPickerSelection(branch);
          }}
        />
      ))}
    </div>
  );
};
