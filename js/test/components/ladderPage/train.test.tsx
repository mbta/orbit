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
        setSideBarSelection={jest.fn()}
        className={""} // Empty, but still worth making sure it doesn't error :-)
      />,
    );
    expect(view.getByText("1877")).toBeInTheDocument();
    expect(view.getByText("1877")).toHaveClass("some-border-color");
  });
});
