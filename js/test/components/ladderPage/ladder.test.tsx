import { Ladders } from "../../../components/ladderPage/ladder";
import { useVehiclePositions } from "../../../hooks/useVehiclePositions";
import { StopStatus } from "../../../models/vehiclePosition";
import { vehiclePositionFactory } from "../../helpers/factory";
import { render } from "@testing-library/react";

jest.mock("../../../hooks/useVehiclePositions", () => ({
  __esModule: true,
  useVehiclePositions: jest.fn(),
}));
const mockUseVehiclePositions = useVehiclePositions as jest.MockedFunction<
  typeof useVehiclePositions
>;

describe("Ladder", () => {
  test("shows station names", () => {
    mockUseVehiclePositions.mockReturnValue([]);
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
    const view = render(<Ladders routeId="Red" />);
    expect(view.getByText("1877")).toBeInTheDocument();
    expect(view.getByText("1888")).toBeInTheDocument();
    expect(view.getByText("1889")).toBeInTheDocument();
    expect(view.queryByText("1999")).not.toBeInTheDocument();
  });
});
