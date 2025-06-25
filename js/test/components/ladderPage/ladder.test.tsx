import { Ladders } from "../../../components/ladderPage/ladder";
import { useTripUpdates } from "../../../hooks/useTripUpdates";
import { useVehiclePositions } from "../../../hooks/useVehiclePositions";
import { StopStatus } from "../../../models/vehiclePosition";
import {
  tripUpdateFactory,
  vehiclePositionFactory,
} from "../../helpers/factory";
import { render } from "@testing-library/react";

jest.mock("../../../hooks/useVehiclePositions", () => ({
  __esModule: true,
  useVehiclePositions: jest.fn(),
}));
const mockUseVehiclePositions = useVehiclePositions as jest.MockedFunction<
  typeof useVehiclePositions
>;

jest.mock("../../../hooks/useTripUpdates", () => ({
  __esModule: true,
  useTripUpdates: jest.fn(),
}));
const mockUseTripUpdates = useTripUpdates as jest.MockedFunction<
  typeof useTripUpdates
>;

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
    mockUseVehiclePositions.mockReturnValue([]);
    mockUseTripUpdates.mockReturnValue([]);
    const view = render(
      <Ladders routeId={"Red"} setSideBarSelection={jest.fn()} />,
    );
    expect(view.getByText("Alewife")).toBeInTheDocument();
    expect(view.getByText("Ashmont")).toBeInTheDocument();
    expect(view.getByText("Braintree")).toBeInTheDocument();
  });

  test("shows valid vehicles on the ladder", () => {
    mockUseVehiclePositions.mockReturnValue([
      vehiclePositionFactory.build(),
      vehiclePositionFactory.build({
        vehicleId: nextVehicleId(),
        directionId: 0,
        label: "1888",
        position: { latitude: 42.32272, longitude: -71.052925 },
        stopId: "70085",
      }),
      vehiclePositionFactory.build({
        vehicleId: nextVehicleId(),
        label: "1889",
        stationId: "place-davis",
        stopId: "70064",
        position: { latitude: 42.39674, longitude: -71.121815 },
        stopStatus: StopStatus.StoppedAt,
      }),
      vehiclePositionFactory.build({
        vehicleId: nextVehicleId(),
        label: "1999",
        position: null,
        stationId: null,
        stopId: null,
      }),
    ]);
    mockUseTripUpdates.mockReturnValue([]);

    const view = render(
      <Ladders routeId="Red" setSideBarSelection={jest.fn()} />,
    );
    expect(view.getByText("1877")).toBeInTheDocument();
    expect(view.getByText("1888")).toBeInTheDocument();
    expect(view.getByText("1889")).toBeInTheDocument();
    expect(view.queryByText("1999")).not.toBeInTheDocument();
  });

  describe("pill colors", () => {
    beforeEach(() => {
      mockUseTripUpdates.mockReturnValue([
        tripUpdateFactory.build({
          tripId: "11111",
          routePatternId: "Red-1-0",
        }),
        tripUpdateFactory.build({
          tripId: "22222",
          routePatternId: "Red-3-0",
        }),
      ]);
    });

    describe("when route pattern is provided", () => {
      test("renders pill color based on route pattern", () => {
        mockUseVehiclePositions.mockReturnValue([
          vehiclePositionFactory.build({
            vehicleId: nextVehicleId(),
            label: "1888",
            stationId: "place-davis",
            stopId: "70064",
            tripId: "11111",
          }),
          vehiclePositionFactory.build({
            vehicleId: nextVehicleId(),
            label: "1889",
            stationId: "place-davis",
            stopId: "70064",
            tripId: "22222",
          }),
        ]);

        const view = render(
          <Ladders routeId="Red" setSideBarSelection={jest.fn()} />,
        );
        expect(view.getByText("1888")).toBeInTheDocument();
        expect(view.getByText("1888")).toHaveClass("border-tangerine");
        expect(view.getByText("1889")).toBeInTheDocument();
        expect(view.getByText("1889")).toHaveClass("border-crimson");
      });
    });

    describe("when route pattern is not provided", () => {
      test("renders pill color based on portion of ladder", () => {
        mockUseVehiclePositions.mockReturnValue([
          // Ashmont portion of ladder
          vehiclePositionFactory.build({
            vehicleId: nextVehicleId(),
            label: "1888",
            stationId: "place-jfk",
            stopId: "70085",
            tripId: null,
          }),
          vehiclePositionFactory.build({
            vehicleId: nextVehicleId(),
            label: "1889",
            stationId: "place-jfk",
            stopId: "70086",
            tripId: null,
          }),
          // Braintree portion of ladder
          vehiclePositionFactory.build({
            vehicleId: nextVehicleId(),
            label: "1890",
            stationId: "place-jfk",
            stopId: "70095",
            tripId: null,
          }),
          vehiclePositionFactory.build({
            vehicleId: nextVehicleId(),
            label: "1891",
            stationId: "place-jfk",
            stopId: "70096",
            tripId: null,
          }),
          // Alewife portion of ladder
          vehiclePositionFactory.build({
            vehicleId: nextVehicleId(),
            label: "1892",
            stationId: "place-davis",
            stopId: "70063",
            tripId: null,
          }),
          vehiclePositionFactory.build({
            vehicleId: nextVehicleId(),
            label: "1893",
            stationId: "place-davis",
            stopId: "70064",
            tripId: null,
          }),
        ]);

        const view = render(
          <Ladders routeId="Red" setSideBarSelection={jest.fn()} />,
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
});
