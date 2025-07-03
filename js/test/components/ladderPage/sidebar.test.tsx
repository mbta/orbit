import { SideBar } from "../../../components/ladderPage/sidebar";
import {
  sideBarSelectionFactory,
  stopTimeUpdateFactory,
} from "../../helpers/factory";
import { render } from "@testing-library/react";
import { DateTime } from "luxon";

describe("sidebar", () => {
  test("contains consist with bolded lead car", () => {
    const view = render(
      <SideBar selection={sideBarSelectionFactory.build()} close={() => {}} />,
    );
    expect(view.getByText("1888")).toHaveClass("font-bold text-2xl");
    expect(view.getByText("1720")).toBeInTheDocument();
  });

  describe("Current Trip section", () => {
    test("header present", () => {
      const view = render(<SideBar selection={null} close={() => {}} />);
      expect(view.getByText("Current Trip")).toBeInTheDocument();
    });

    test("shows empty data fields (for now)", () => {
      const view = render(<SideBar selection={null} close={() => {}} />);
      expect(view.getAllByText("---")).toHaveLength(5);
    });

    test("shows estimated arrival time if available", () => {
      const view = render(
        <SideBar
          selection={sideBarSelectionFactory.build()}
          close={() => {}}
        />,
      );
      expect(view.getByText("5:51p")).toBeInTheDocument();
    });

    // nonrev trips
    test("shows passthrough time (if est arrival not available)", () => {
      const stu = stopTimeUpdateFactory.build({
        predictedArrivalTime: null,
        predictedDepartureTime: null,
        passthroughTime: DateTime.fromISO("2025-05-15T12:51:38.626Z"),
      });
      const view = render(
        <SideBar
          selection={sideBarSelectionFactory.build({
            stopTimeUpdate: stu,
          })}
          close={() => {}}
        />,
      );
      expect(view.getByText("8:51a")).toBeInTheDocument();
    });
  });
});
