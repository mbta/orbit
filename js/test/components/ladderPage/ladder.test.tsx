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

describe("Ladder", () => {
  test("shows station names", () => {
    mockUseVehiclePositions.mockReturnValue([]);
    mockUseTripUpdates.mockReturnValue([]);
    const view = render(<Ladders routeId={"Red"} />);
    expect(view.getByText("Alewife")).toBeInTheDocument();
    expect(view.getByText("Ashmont")).toBeInTheDocument();
    expect(view.getByText("Braintree")).toBeInTheDocument();
  });

  test("shows valid vehicles on the ladder", () => {
    mockUseVehiclePositions.mockReturnValue([
      vehiclePositionFactory.build(),
      vehiclePositionFactory.build({
        directionId: 0,
        label: "1888",
        position: { latitude: 42.32272, longitude: -71.052925 },
        stopId: "70085",
      }),
      vehiclePositionFactory.build({
        label: "1889",
        stationId: "place-davis",
        stopId: "70064",
        position: { latitude: 42.39674, longitude: -71.121815 },
        stopStatus: StopStatus.StoppedAt,
      }),
      vehiclePositionFactory.build({
        label: "1999",
        position: null,
        stationId: null,
        stopId: null,
      }),
    ]);
    mockUseTripUpdates.mockReturnValue([]);

    const view = render(<Ladders routeId="Red" />);
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

    describe("when trains are on alewife branch of ladder", () => {
      test("renders pill color based on route pattern", () => {
        mockUseVehiclePositions.mockReturnValue([
          vehiclePositionFactory.build({
            label: "1888",
            stationId: "place-davis",
            stopId: "70064",
            trip: { tripId: "11111" },
          }),
          vehiclePositionFactory.build({
            label: "1889",
            stationId: "place-davis",
            stopId: "70064",
            trip: { tripId: "22222" },
          }),
        ]);

        const view = render(<Ladders routeId="Red" />);
        expect(view.getByText("1888")).toBeInTheDocument();
        expect(view.getByText("1888")).toHaveClass("border-tangerine");
        expect(view.getByText("1889")).toBeInTheDocument();
        expect(view.getByText("1889")).toHaveClass("border-crimson");
      });
    });

    describe("when trains are on ashmont branch of ladder", () => {
      test("renders orange pill color regardless of route pattern", () => {
        mockUseVehiclePositions.mockReturnValue([
          vehiclePositionFactory.build({
            label: "1888",
            stationId: "place-jfk",
            stopId: "70085",
            trip: { tripId: "11111" },
          }),
          vehiclePositionFactory.build({
            label: "1889",
            stationId: "place-jfk",
            stopId: "70086",
            trip: { tripId: "22222" },
          }),
        ]);

        const view = render(<Ladders routeId="Red" />);
        expect(view.getByText("1888")).toBeInTheDocument();
        expect(view.getByText("1888")).toHaveClass("border-tangerine");
        expect(view.getByText("1889")).toBeInTheDocument();
        expect(view.getByText("1889")).toHaveClass("border-tangerine");
      });
    });

    describe("when trains are on braintree branch of ladder", () => {
      test("renders red pill color regardless of route pattern", () => {
        mockUseVehiclePositions.mockReturnValue([
          vehiclePositionFactory.build({
            label: "1888",
            stationId: "place-jfk",
            stopId: "70095",
            trip: { tripId: "11111" },
          }),
          vehiclePositionFactory.build({
            label: "1889",
            stationId: "place-jfk",
            stopId: "70096",
            trip: { tripId: "22222" },
          }),
        ]);

        const view = render(<Ladders routeId="Red" />);
        expect(view.getByText("1888")).toBeInTheDocument();
        expect(view.getByText("1888")).toHaveClass("border-crimson");
        expect(view.getByText("1889")).toBeInTheDocument();
        expect(view.getByText("1889")).toHaveClass("border-crimson");
      });
    });
  });
});
