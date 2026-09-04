import { RouteId } from "../../models/common";

const branches = ["Alewife", "Ashmont", "Braintree"] as const;
export type BranchPickerSelection = (typeof branches)[number];

const defaultBg =
  "bg-ladder-branch-picker-inactive-bg-dark light:bg-ladder-branch-picker-inactive-bg-light";

const activeText =
  "text-ladder-branch-picker-active-dot-dark light:text-ladder-branch-picker-active-dot-light";

const branchColors = {
  Red: {
    Alewife: {
      bg: "bg-ladder-branch-picker-alewife-dot-dark light:bg-ladder-branch-picker-alewife-dot-light",
      dotText:
        "text-ladder-branch-picker-alewife-dot-dark light:text-ladder-branch-picker-alewife-dot-light",
    },
    Ashmont: {
      bg: "bg-heavy-rail-ashmont",
      dotText: "text-heavy-rail-ashmont",
    },
    Braintree: {
      bg: "bg-heavy-rail-braintree",
      dotText: "text-heavy-rail-braintree",
    },
  },
} satisfies Partial<
  Record<
    RouteId,
    Record<BranchPickerSelection, { bg: string; dotText: string }>
  >
>;

const BranchButton = ({
  branch,
  isActive,
  onClick,
}: {
  branch: BranchPickerSelection;
  isActive: boolean;
  onClick: () => void;
}) => {
  const { bg, dotText } = branchColors.Red[branch];
  const buttonBg = isActive ? bg : defaultBg;
  const labelText = isActive ? activeText : "text-white";
  const dotColor = isActive ? activeText : dotText;

  return (
    <button
      className={`flex flex-col justify-center items-center grow ${buttonBg} rounded-t text-center font-semibold h-16 p-4 gap-1`}
      onClick={onClick}
    >
      <div className={labelText} data-testid="branch-label">
        {branch}
      </div>
      <div
        className={`w-2 min-h-2 rounded-full bg-current ${dotColor}`}
        data-testid="branch-dot"
      />
    </button>
  );
};

export const BranchPicker = ({
  selection,
  setSelection,
}: {
  selection: BranchPickerSelection;
  setSelection: (selection: BranchPickerSelection) => void;
}) => {
  return (
    <div
      className="flex justify-between h-14 self-center gap-1 w-full max-w-[371px]"
      data-testid="branch-picker"
    >
      {branches.map((branch) => (
        <BranchButton
          key={branch}
          branch={branch}
          isActive={selection === branch}
          onClick={() => {
            setSelection(branch);
          }}
        />
      ))}
    </div>
  );
};
