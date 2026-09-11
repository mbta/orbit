import { RouteId } from "../../models/common";

// Use index from LadderConfig sub-array (Stations[routeId])
// i.e. 0 for Alewife, 1 for Ashmont, 2 for Braintree
export type BranchPickerSelection = number;

const routeBranchLabels: Readonly<Record<RouteId, readonly string[]>> = {
  Red: ["Alewife", "Ashmont", "Braintree"] as const,
};

const defaultBg =
  "bg-ladder-branch-picker-inactive-bg-dark light:bg-ladder-branch-picker-inactive-bg-light";

const activeText =
  "text-ladder-branch-picker-active-dot-dark light:text-ladder-branch-picker-active-dot-light";

const branchColors: Readonly<
  Record<RouteId, Record<string, { bg: string; dotText: string }>>
> = {
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
};

const BranchButton = ({
  route,
  branch,
  isActive,
  onClick,
}: {
  route: RouteId;
  branch: BranchPickerSelection;
  isActive: boolean;
  onClick: () => void;
}) => {
  const label = routeBranchLabels[route][branch];
  const { bg, dotText } = branchColors[route][label];
  const buttonBg = isActive ? bg : defaultBg;
  const labelText = isActive ? activeText : "text-white";
  const dotColor = isActive ? activeText : dotText;

  return (
    <button
      className={`flex flex-col justify-center items-center grow ${buttonBg} rounded-t text-center font-semibold h-16 p-4 gap-1`}
      onClick={onClick}
    >
      <div className={labelText} data-testid="branch-label">
        {label}
      </div>
      <div
        className={`w-2 min-h-2 rounded-full bg-current ${dotColor}`}
        data-testid="branch-dot"
      />
    </button>
  );
};

export const BranchPicker = ({
  route,
  selection,
  setSelection,
}: {
  route: RouteId;
  selection: BranchPickerSelection;
  setSelection: (selection: BranchPickerSelection) => void;
}) => {
  return (
    <div
      className="flex justify-between h-14 self-center gap-1 w-full max-w-[371px]"
      data-testid="branch-picker"
    >
      {routeBranchLabels[route].map((_label, branch) => (
        <BranchButton
          key={branch}
          route={route}
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
