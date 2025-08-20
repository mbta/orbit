import { VehicleWithHeight } from "../../../components/ladderPage/ladder";
import {
  avoidLabelOverlaps,
  Train,
} from "../../../components/ladderPage/train";
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

describe("avoidLabelOverlaps", () => {
  test("calculates labelOffsets for a sorted array of vehiclesWithHeights", () => {
    // not using accurate vehicle or trip values, only heights are relevant for test
    const vehiclesWithHeights: VehicleWithHeight[] = [
      // northbound
      {
        // specifically test catching vehicles at Alewife-01 despite the directionId
        vehicle: vehicleFactory.build({
          vehiclePosition: { directionId: 0, stopId: "Alewife-01" },
        }),
        heights: { dotHeight: 80, labelOffset: null },
      },
      {
        vehicle: vehicleFactory.build(),
        heights: { dotHeight: 85, labelOffset: null },
      },
      {
        vehicle: vehicleFactory.build(),
        heights: { dotHeight: 100, labelOffset: null },
      },
      {
        vehicle: vehicleFactory.build(),
        heights: { dotHeight: 250, labelOffset: null },
      },
      //southbound
      {
        // specifically test catching vehicles at Alewife-02 despite the directionId
        vehicle: vehicleFactory.build({
          vehiclePosition: { directionId: 1, stopId: "Alewife-02" },
        }),
        heights: { dotHeight: 80, labelOffset: null },
      },
      {
        vehicle: vehicleFactory.build({ vehiclePosition: { directionId: 0 } }),
        heights: { dotHeight: 85, labelOffset: null },
      },
      {
        vehicle: vehicleFactory.build({ vehiclePosition: { directionId: 0 } }),
        heights: { dotHeight: 100, labelOffset: null },
      },
      {
        vehicle: vehicleFactory.build({ vehiclePosition: { directionId: 0 } }),
        heights: { dotHeight: 250, labelOffset: null },
      },
    ];
    expect(avoidLabelOverlaps(vehiclesWithHeights)).toStrictEqual([
      // southbound (northbound gets concatenated onto southbound during processing, thus new order)
      {
        vehicle: vehicleFactory.build({ vehiclePosition: { directionId: 0 } }),
        heights: { dotHeight: 250, labelOffset: null },
      },
      {
        vehicle: vehicleFactory.build({ vehiclePosition: { directionId: 0 } }),
        heights: { dotHeight: 100, labelOffset: null },
      },
      {
        vehicle: vehicleFactory.build({ vehiclePosition: { directionId: 0 } }),
        heights: { dotHeight: 85, labelOffset: 27 },
      },
      {
        vehicle: vehicleFactory.build({
          vehiclePosition: { directionId: 1, stopId: "Alewife-02" },
        }),
        heights: { dotHeight: 80, labelOffset: 64 },
      },
      // northbound
      {
        vehicle: vehicleFactory.build({
          vehiclePosition: { directionId: 0, stopId: "Alewife-01" },
        }),
        heights: { dotHeight: 80, labelOffset: null },
      },
      {
        vehicle: vehicleFactory.build(),
        heights: { dotHeight: 85, labelOffset: 37 },
      },
      {
        vehicle: vehicleFactory.build(),
        heights: { dotHeight: 100, labelOffset: 64 },
      },
      {
        vehicle: vehicleFactory.build(),
        heights: { dotHeight: 250, labelOffset: null },
      },
    ]);
  });
});
