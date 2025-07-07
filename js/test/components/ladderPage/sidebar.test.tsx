import { SideBar } from "../../../components/ladderPage/sidebar";
import { vehicleFactory } from "../../helpers/factory";
import { render } from "@testing-library/react";

describe("sidebar", () => {
  test("contains consist with bolded lead car", () => {
    const view = render(
      <SideBar
        selection={{ vehicle: vehicleFactory.build() }}
        close={() => {}}
      />,
    );
    expect(view.getByText("1877")).toHaveClass("font-bold text-2xl");
    expect(view.getByText("1814")).toBeInTheDocument();
  });

  describe("Current Trip section", () => {
    test("header present", () => {
      const view = render(
        <SideBar
          selection={{ vehicle: vehicleFactory.build() }}
          close={() => {}}
        />,
      );
      expect(view.getByText("Current Trip")).toBeInTheDocument();
    });

    test("shows estimated arrival time if available", () => {
      const view = render(
        <SideBar
          selection={{ vehicle: vehicleFactory.build() }}
          close={() => {}}
        />,
      );
      expect(view.getByText("9:51p")).toBeInTheDocument();
    });
  });
});
