import { SideBar } from "../../../components/ladderPage/sidebar";
import {
  stopTimeUpdateFactory,
  tripUpdateFactory,
  vehicleFactory,
} from "../../helpers/factory";
import { render } from "@testing-library/react";
import { DateTime } from "luxon";

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

    // nonrev trips
    test("shows passthrough time (if est arrival not available)", () => {
      const stu = stopTimeUpdateFactory.build({
        predictedArrivalTime: null,
        predictedDepartureTime: null,
        passthroughTime: DateTime.fromISO("2025-07-03T08:30:38"),
      });
      const view = render(
        <SideBar
          selection={{
            vehicle: vehicleFactory.build({
              tripUpdate: tripUpdateFactory.build({ stopTimeUpdates: [stu] }),
            }),
          }}
          close={() => {}}
        />,
      );
      expect(view.getByText("8:30a")).toBeInTheDocument();
    });
  });
});
