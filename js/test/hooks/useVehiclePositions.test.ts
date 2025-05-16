import { useChannel } from "../../hooks/useChannel";
import { useVehiclePositions } from "../../hooks/useVehiclePositions";
import { vehiclePositionFactory } from "../helpers/factory";
import { renderHook } from "@testing-library/react";

jest.mock("../../hooks/useChannel", () => ({
  __esModule: true,
  useChannel: jest.fn(),
}));
const mockUseChannel = useChannel as jest.MockedFunction<typeof useChannel>;

describe("useVehiclePositions", () => {
  beforeAll(() => {
    mockUseChannel.mockReturnValue({
      data: [],
    });
  });
  test("subscribes to the proper topic", () => {
    renderHook(useVehiclePositions);
    expect(mockUseChannel).toHaveBeenCalledWith(
      expect.objectContaining({
        topic: "train_locations",
        event: "vehicle_positions",
      }),
    );
  });

  test("parses no vehicle positions", () => {
    const { result } = renderHook(useVehiclePositions);
    expect(result.current).toEqual({ data: [] });
  });

  test("parses one vehicle position", () => {
    mockUseChannel.mockReturnValue({
      data: [vehiclePositionFactory.build()],
    });
    const { result } = renderHook(useVehiclePositions);

    expect(result.current).toEqual({
      data: [
        expect.objectContaining({
          label: "1877",
          routeId: "Red",
          stationId: "place-jfk",
          stopId: "70096"
        }),
      ],
    });
  });
});
