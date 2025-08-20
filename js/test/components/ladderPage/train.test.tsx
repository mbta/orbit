import { Train } from "../../../components/ladderPage/train";
import {
  TrainTheme,
  TrainThemes,
} from "../../../components/ladderPage/trainTheme";
import { vehicleFactory } from "../../helpers/factory";
import { render } from "@testing-library/react";

describe("Train", () => {
  test("shows label", () => {
    const view = render(
      <Train
        theme={TrainThemes.crimson}
        vehicle={vehicleFactory.build()}
        forceDirection={0}
        labelOffset={null}
        setSideBarSelection={jest.fn()}
      />,
    );
    expect(view.getByText("1877")).toBeInTheDocument();
  });

  test("accepts additional properties", () => {
    const view = render(
      <Train
        theme={TrainThemes.crimson}
        highlight={true}
        vehicle={vehicleFactory.build()}
        forceDirection={0}
        labelOffset={null}
        setSideBarSelection={jest.fn()}
        className={""} // Empty, but still worth making sure it doesn't error :-)
      />,
    );
    expect(view.getByText("1877")).toBeInTheDocument();
  });

  test("renders based on provided theme", () => {
    const theme: TrainTheme = {
      backgroundColor: "some-background-color",
      borderColor: "some-border-color",
    };
    const view = render(
      <Train
        theme={theme}
        vehicle={vehicleFactory.build()}
        highlight={true}
        forceDirection={1}
        labelOffset={null}
        setSideBarSelection={jest.fn()}
        className={""} // Empty, but still worth making sure it doesn't error :-)
      />,
    );
    expect(view.getByText("1877")).toBeInTheDocument();
    expect(view.getByText("1877")).toHaveClass("some-border-color");
  });

  test("renders at an angle when labelOffset provided", () => {
    const view = render(
      <Train
        theme={TrainThemes.crimson}
        vehicle={vehicleFactory.build()}
        forceDirection={1}
        labelOffset={42}
        setSideBarSelection={jest.fn()}
      />,
    );

    // using a testId here because adding role="img" may cause undue attention from 
    // assistive tech and needlessly apply roles to several components.
    expect(view.getByTestId("dot-pill-connector-line")).toHaveAttribute(
      "y2",
      "42",
    );
    expect(view.getByRole("button")).toHaveStyle({ top: "42px" });
  });
});
