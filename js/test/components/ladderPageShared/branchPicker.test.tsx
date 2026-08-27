import {
  BranchPicker,
  BranchPickerSelection,
} from "../../../components/ladderPageShared/branchPicker";
import { render, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const defaultBg =
  "bg-ladder-branch-picker-inactive-bg-dark light:bg-ladder-branch-picker-inactive-bg-light";
const activeText =
  "text-ladder-branch-picker-active-dot-dark light:text-ladder-branch-picker-active-dot-light";

const branches: BranchPickerSelection[] = ["Alewife", "Ashmont", "Braintree"];

const activeBg: Record<BranchPickerSelection, string> = {
  Alewife:
    "bg-ladder-branch-picker-alewife-dot-dark light:bg-ladder-branch-picker-alewife-dot-light",
  Ashmont: "bg-heavy-rail-ashmont",
  Braintree: "bg-heavy-rail-braintree",
};

const inactiveDotText: Record<BranchPickerSelection, string> = {
  Alewife:
    "text-ladder-branch-picker-alewife-dot-dark light:text-ladder-branch-picker-alewife-dot-light",
  Ashmont: "text-heavy-rail-ashmont",
  Braintree: "text-heavy-rail-braintree",
};

describe("BranchPicker", () => {
  test("renders all three branch buttons", () => {
    const view = render(
      <BranchPicker
        branchPickerSelection="Alewife"
        setBranchPickerSelection={jest.fn()}
      />,
    );
    expect(view.getByRole("button", { name: /Alewife/i })).toBeInTheDocument();
    expect(view.getByRole("button", { name: /Ashmont/i })).toBeInTheDocument();
    expect(
      view.getByRole("button", { name: /Braintree/i }),
    ).toBeInTheDocument();
  });

  describe.each(branches)("when %s is selected", (activeBranch) => {
    test("active button has branch-specific background", () => {
      const view = render(
        <BranchPicker
          branchPickerSelection={activeBranch}
          setBranchPickerSelection={jest.fn()}
        />,
      );
      expect(
        view.getByRole("button", { name: new RegExp(activeBranch, "i") }),
      ).toHaveClass(activeBg[activeBranch]);
    });

    test("inactive buttons have default background", () => {
      const view = render(
        <BranchPicker
          branchPickerSelection={activeBranch}
          setBranchPickerSelection={jest.fn()}
        />,
      );
      branches
        .filter((b) => b !== activeBranch)
        .forEach((branch) => {
          expect(
            view.getByRole("button", { name: new RegExp(branch, "i") }),
          ).toHaveClass(defaultBg);
        });
    });

    test("active button label has dark-blue text", () => {
      const view = render(
        <BranchPicker
          branchPickerSelection={activeBranch}
          setBranchPickerSelection={jest.fn()}
        />,
      );
      const button = view.getByRole("button", {
        name: new RegExp(activeBranch, "i"),
      });
      expect(within(button).getByTestId("branch-label")).toHaveClass(
        activeText,
      );
    });

    test("inactive button labels have white text", () => {
      const view = render(
        <BranchPicker
          branchPickerSelection={activeBranch}
          setBranchPickerSelection={jest.fn()}
        />,
      );
      branches
        .filter((b) => b !== activeBranch)
        .forEach((branch) => {
          const button = view.getByRole("button", {
            name: new RegExp(branch, "i"),
          });
          expect(within(button).getByTestId("branch-label")).toHaveClass(
            "text-white",
          );
        });
    });

    test("inactive button dots have branch-specific color", () => {
      const view = render(
        <BranchPicker
          branchPickerSelection={activeBranch}
          setBranchPickerSelection={jest.fn()}
        />,
      );
      branches
        .filter((b) => b !== activeBranch)
        .forEach((branch) => {
          const button = view.getByRole("button", {
            name: new RegExp(branch, "i"),
          });
          expect(within(button).getByTestId("branch-dot")).toHaveClass(
            inactiveDotText[branch],
          );
        });
    });

    test("active button dot has dark-blue text", () => {
      const view = render(
        <BranchPicker
          branchPickerSelection={activeBranch}
          setBranchPickerSelection={jest.fn()}
        />,
      );
      const button = view.getByRole("button", {
        name: new RegExp(activeBranch, "i"),
      });
      expect(within(button).getByTestId("branch-dot")).toHaveClass(activeText);
    });
  });

  describe("clicking buttons", () => {
    test.each(branches)(
      "clicking %s calls setBranchPickerSelection with correct value",
      async (branch) => {
        const mockSet = jest.fn();
        const user = userEvent.setup();
        const view = render(
          <BranchPicker
            branchPickerSelection="Alewife"
            setBranchPickerSelection={mockSet}
          />,
        );
        await user.click(
          view.getByRole("button", { name: new RegExp(branch, "i") }),
        );
        expect(mockSet).toHaveBeenCalledWith(branch);
      },
    );
  });
});
