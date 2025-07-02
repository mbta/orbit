import { Train } from "../../../components/ladderPage/train";
import {
  TrainTheme,
  TrainThemes,
} from "../../../components/ladderPage/trainTheme";
import { CarId } from "../../../models/common";
import { stopTimeUpdateFactory } from "../../helpers/factory";
import { render } from "@testing-library/react";

describe("Train", () => {
  const consist: CarId[] = ["1851", "1850", "1883", "1882", "1881", "1880"];

  test("shows label", () => {
    const view = render(
      <Train
        theme={TrainThemes.crimson}
        label="1851"
        direction={0}
        consist={consist}
        stopTimeUpdate={stopTimeUpdateFactory.build()}
        setSideBarSelection={jest.fn()}
      />,
    );
    expect(view.getByText("1851")).toBeInTheDocument();
  });

  test("accepts additional properties", () => {
    const view = render(
      <Train
        theme={TrainThemes.crimson}
        label="1851"
        highlight={true}
        direction={0}
        consist={consist}
        stopTimeUpdate={stopTimeUpdateFactory.build()}
        setSideBarSelection={jest.fn()}
        className={""} // Empty, but still worth making sure it doesn't error :-)
      />,
    );
    expect(view.getByText("1851")).toBeInTheDocument();
  });

  test("renders based on provided theme", () => {
    const theme: TrainTheme = {
      backgroundColor: "some-background-color",
      borderColor: "some-border-color",
    };
    const view = render(
      <Train
        theme={theme}
        label="1880"
        highlight={true}
        direction={1}
        consist={consist}
        stopTimeUpdate={stopTimeUpdateFactory.build()}
        setSideBarSelection={jest.fn()}
        className={""} // Empty, but still worth making sure it doesn't error :-)
      />,
    );
    expect(view.getByText("1880")).toBeInTheDocument();
    expect(view.getByText("1880")).toHaveClass("some-border-color");
  });
});
