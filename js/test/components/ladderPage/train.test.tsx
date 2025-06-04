import { Train } from "../../../components/ladderPage/train";
import {
  TrainTheme,
  TrainThemes,
} from "../../../components/ladderPage/trainTheme";
import { render } from "@testing-library/react";

describe("Train", () => {
  test("shows label", () => {
    const view = render(
      <Train theme={TrainThemes.crimson} label="1875" direction={0} />,
    );
    expect(view.getByText("1875")).toBeInTheDocument();
  });

  test("accepts additional properties", () => {
    const view = render(
      <Train
        theme={TrainThemes.crimson}
        label="1875"
        highlight={true}
        direction={0}
        className={""} // Empty, but still worth making sure it doesn't error :-)
      />,
    );
    expect(view.getByText("1875")).toBeInTheDocument();
  });

  test("renders based on provided theme", () => {
    const theme: TrainTheme = {
      backgroundColor: "some-background-color",
      borderColor: "some-border-color",
    };
    const view = render(
      <Train
        theme={theme}
        label="1875"
        highlight={true}
        direction={0}
        className={""} // Empty, but still worth making sure it doesn't error :-)
      />,
    );
    expect(view.getByText("1875")).toBeInTheDocument();
    expect(view.getByText("1875")).toHaveClass("some-border-color");
  });
});
