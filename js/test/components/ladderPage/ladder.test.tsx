import { Ladder } from "../../../components/ladderPage/ladder";
import { render } from "@testing-library/react";

describe("Ladder", () => {
  test("shows station names", () => {
    const view = render(<Ladder />);
    expect(view.getByText("Alewife")).toBeInTheDocument();
    expect(view.getByText("Ashmont")).toBeInTheDocument();
    expect(view.getByText("Braintree")).toBeInTheDocument();
  });
});
