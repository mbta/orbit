import { Ladders } from "../../../components/ladderPage/ladder";
import { useVehicles } from "../../../hooks/useVehicles";
import { StopStatus } from "../../../models/vehiclePosition";
import {
  tripUpdateFactory,
  vehicleFactory,
  vehiclePositionFactory,
} from "../../helpers/factory";
import { render } from "@testing-library/react";

jest.mock("../../../hooks/useVehicles", () => ({
  __esModule: true,
  useVehicles: jest.fn(),
}));
const mockUseVehicles = useVehicles as jest.MockedFunction<typeof useVehicles>;

// Vehicle IDs get used as React component keys, so make sure we
// use a different ID for each mock vehicle, or render will complain
const nextVehicleId = (() => {
  let mockVehicleId = 0;
  return () => {
    return `mock-id-${mockVehicleId++}`;
  };
})();

describe("Ladder", () => {
  test("shows station names", () => {
    mockUseVehicles.mockReturnValue([]);
    const view = render(
      <Ladders
        routeId={"Red"}
        setSideBarSelection={jest.fn()}
        sideBarSelection={null}
      />,
    );
    expect(view.getByText("Alewife")).toBeInTheDocument();
    expect(view.getByText("Ashmont")).toBeInTheDocument();
    expect(view.getByText("Braintree")).toBeInTheDocument();
  });

  test("shows valid vehicles on the ladder", () => {
    mockUseVehicles.mockReturnValue([
      vehicleFactory.build({ vehiclePosition: vehiclePositionFactory.build() }),
      vehicleFactory.build({
        vehiclePosition: vehiclePositionFactory.build({
          vehicleId: nextVehicleId(),
          directionId: 0,
          label: "1888",
          position: { latitude: 42.32272, longitude: -71.052925 },
          stopId: "70085",
        }),
      }),
      vehicleFactory.build({
        vehiclePosition: vehiclePositionFactory.build({
          vehicleId: nextVehicleId(),
          label: "1889",
          stationId: "place-davis",
          stopId: "70064",
          position: { latitude: 42.39674, longitude: -71.121815 },
          stopStatus: StopStatus.StoppedAt,
        }),
      }),
      vehicleFactory.build({
        vehiclePosition: vehiclePositionFactory.build({
          vehicleId: nextVehicleId(),
          label: "1999",
          position: null,
          stationId: null,
          stopId: null,
        }),
      }),
    ]);

    const view = render(
      <Ladders
        routeId="Red"
        setSideBarSelection={jest.fn()}
        sideBarSelection={null}
      />,
    );
    expect(view.getByText("1877")).toBeInTheDocument();
    expect(view.getByText("1888")).toBeInTheDocument();
    expect(view.getByText("1889")).toBeInTheDocument();
    expect(view.queryByText("1999")).not.toBeInTheDocument();
  });

  describe("pill colors", () => {
    beforeEach(() => {
      mockUseVehicles.mockReturnValue([
        vehicleFactory.build({
          tripUpdate: tripUpdateFactory.build({
            tripId: "11111",
            routePatternId: "Red-1-0",
          }),
        }),
        vehicleFactory.build({
          tripUpdate: tripUpdateFactory.build({
            tripId: "22222",
            routePatternId: "Red-3-0",
          }),
        }),
      ]);
    });

    describe("when route pattern is provided", () => {
      test("renders pill color based on route pattern", () => {
        mockUseVehicles.mockReturnValue([
          vehicleFactory.build({
            vehiclePosition: vehiclePositionFactory.build({
              vehicleId: nextVehicleId(),
              label: "1888",
              stationId: "place-davis",
              stopId: "70064",
              tripId: "11111",
            }),
            tripUpdate: tripUpdateFactory.build({
              routePatternId: "Red-1-0",
            }),
          }),
          vehicleFactory.build({
            vehiclePosition: vehiclePositionFactory.build({
              vehicleId: nextVehicleId(),
              label: "1889",
              stationId: "place-davis",
              stopId: "70064",
              tripId: "22222",
            }),
            tripUpdate: tripUpdateFactory.build({
              routePatternId: "Red-3-0",
            }),
          }),
        ]);

        const view = render(
          <Ladders
            routeId="Red"
            setSideBarSelection={jest.fn()}
            sideBarSelection={null}
          />,
        );
        expect(view.getByText("1888")).toBeInTheDocument();
        expect(view.getByText("1888")).toHaveClass("border-tangerine");
        expect(view.getByText("1889")).toBeInTheDocument();
        expect(view.getByText("1889")).toHaveClass("border-crimson");
      });
    });

    describe("when route pattern is not provided", () => {
      test("renders pill color based on portion of ladder", () => {
        mockUseVehicles.mockReturnValue([
          vehicleFactory.build({
            vehiclePosition: vehiclePositionFactory.build({
              vehicleId: nextVehicleId(),
              label: "1888",
              stationId: "place-jfk",
              stopId: "70085",
              tripId: null,
            }),
            tripUpdate: undefined,
          }),
          // Ashmont portion of ladder
          vehicleFactory.build({
            vehiclePosition: vehiclePositionFactory.build({
              vehicleId: nextVehicleId(),
              label: "1889",
              stationId: "place-jfk",
              stopId: "70086",
              tripId: null,
            }),
            tripUpdate: undefined,
          }),
          // Braintree portion of ladder
          vehicleFactory.build({
            vehiclePosition: vehiclePositionFactory.build({
              vehicleId: nextVehicleId(),
              label: "1890",
              stationId: "place-jfk",
              stopId: "70095",
              tripId: null,
            }),
            tripUpdate: undefined,
          }),
          vehicleFactory.build({
            vehiclePosition: vehiclePositionFactory.build({
              vehicleId: nextVehicleId(),
              label: "1891",
              stationId: "place-jfk",
              stopId: "70096",
              tripId: null,
            }),
            tripUpdate: undefined,
          }),
          // Alewife portion of ladder
          vehicleFactory.build({
            vehiclePosition: vehiclePositionFactory.build({
              vehicleId: nextVehicleId(),
              label: "1892",
              stationId: "place-davis",
              stopId: "70063",
              tripId: null,
            }),
            tripUpdate: undefined,
          }),
          vehicleFactory.build({
            vehiclePosition: vehiclePositionFactory.build({
              vehicleId: nextVehicleId(),
              label: "1893",
              stationId: "place-davis",
              stopId: "70064",
              tripId: null,
            }),
            tripUpdate: undefined,
          }),
        ]);

        const view = render(
          <Ladders
            routeId="Red"
            setSideBarSelection={jest.fn()}
            sideBarSelection={null}
          />,
        );

        // Ashmont defaults to orange
        expect(view.getByText("1888")).toBeInTheDocument();
        expect(view.getByText("1888")).toHaveClass("border-tangerine");
        expect(view.getByText("1889")).toBeInTheDocument();
        expect(view.getByText("1889")).toHaveClass("border-tangerine");

        // Braintree and Alewife default to red
        expect(view.getByText("1890")).toBeInTheDocument();
        expect(view.getByText("1890")).toHaveClass("border-crimson");
        expect(view.getByText("1891")).toBeInTheDocument();
        expect(view.getByText("1891")).toHaveClass("border-crimson");
        expect(view.getByText("1892")).toBeInTheDocument();
        expect(view.getByText("1892")).toHaveClass("border-crimson");
        expect(view.getByText("1893")).toBeInTheDocument();
        expect(view.getByText("1893")).toHaveClass("border-crimson");
      });
    });
  });

  describe("pill highlight", () => {
    test("when the sidebar is open", () => {
      mockUseVehicles.mockReturnValue([
        vehicleFactory.build({
          vehiclePosition: vehiclePositionFactory.build({
            vehicleId: nextVehicleId(),
            label: "1888",
            stationId: "place-davis",
            stopId: "70064",
            tripId: "11111",
          }),
        }),
      ]);

      const view = render(
        <Ladders
          routeId="Red"
          setSideBarSelection={jest.fn()}
          sideBarSelection={{
            vehicle: vehicleFactory.build({
              vehiclePosition: vehiclePositionFactory.build({
                label: "1888",
                cars: ["1888", "1889", "1890", "1891"],
              }),
            }),
          }}
        />,
      );
      expect(view.getByText("1888")).toBeInTheDocument();
      expect(view.getByText("1888")).toHaveClass("border-[3px]");
    });

    test("when the sidebar is not open", () => {
      mockUseVehicles.mockReturnValue([
        vehicleFactory.build({
          vehiclePosition: vehiclePositionFactory.build({
            vehicleId: nextVehicleId(),
            label: "1888",
            stationId: "place-davis",
            stopId: "70064",
            tripId: "11111",
          }),
        }),
      ]);

      const view = render(
        <Ladders
          routeId="Red"
          setSideBarSelection={jest.fn()}
          sideBarSelection={null}
        />,
      );
      expect(view.getByText("1888")).toBeInTheDocument();
      expect(view.getByText("1888")).not.toHaveClass("border-[3px]");
    });
  });
});
