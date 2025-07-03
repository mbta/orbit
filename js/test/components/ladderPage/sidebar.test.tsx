import { SideBar } from "../../../components/ladderPage/sidebar";
import { vehicleFactory } from "../../helpers/factory";
import { render } from "@testing-library/react";

describe("sidebar", () => {
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

    test("shows empty data fields (for now)", () => {
      const view = render(
        <SideBar
          selection={{ vehicle: vehicleFactory.build() }}
          close={() => {}}
        />,
      );
      expect(view.getAllByText("---")).toHaveLength(5);
    });
  });
});
