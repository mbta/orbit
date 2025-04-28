import { Train } from "../../../components/ladderPage/train";
import { render } from "@testing-library/react";

describe("Train", () => {
  test("shows label", () => {
    const view = render(<Train route="Red-Ashmont" label="1875" />);
    expect(view.getByText("1875")).toBeInTheDocument();
  });

  test("accepts additional properties", () => {
    const view = render(
      <Train
        route="Red-Ashmont"
        label="1875"
        highlight={true}
        className={""} // Empty, but still worth making sure it doesn't error :-)
      />,
    );
    expect(view.getByText("1875")).toBeInTheDocument();
  });
});
