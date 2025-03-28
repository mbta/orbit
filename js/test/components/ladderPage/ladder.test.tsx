import { Ladder } from "../../../components/ladderPage/ladder";
import { render } from "@testing-library/react";

describe("Ladder", () => {
  test("renders", () => {
    const view = render(<Ladder />);
    expect(view.getByText("Ladder Page")).toBeInTheDocument();
  });
});
