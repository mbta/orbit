import { SideBar } from "../../../components/ladderPage/sidebar";
import { tripUpdateFactory, vehicleFactory } from "../../helpers/factory";
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

    describe("estimated arrival time", () => {
      test("is displayed if available", () => {
        const view = render(
          <SideBar
            selection={{ vehicle: vehicleFactory.build() }}
            close={() => {}}
          />,
        );
        expect(view.getByText("5:51p")).toBeInTheDocument();
      });

      // NOTE: when other sidebar fields are hooked up, perhaps consolidate testing
      // for "---" placeholders into one test mocking missing data for all fields
      test("displays '---' when unavailable", () => {
        const view = render(
          <SideBar
            selection={{
              vehicle: vehicleFactory.build({
                tripUpdate: tripUpdateFactory.build({ stopTimeUpdates: [] }),
              }),
            }}
            close={() => {}}
          />,
        );
        expect(view.getAllByText("---")).toHaveLength(5);
      });
    });
  });
});
