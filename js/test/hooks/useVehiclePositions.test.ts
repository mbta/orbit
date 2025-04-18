import { useChannel } from "../../contexts/socketContext";
import { useVehiclePositions } from "../../hooks/useVehiclePositions";
import { renderHook } from "@testing-library/react";

jest.mock("../../contexts/socketContext", () => ({
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

  test("stringifies output (for now)", () => {
    const { result } = renderHook(useVehiclePositions);
    expect(result.current).toEqual(JSON.stringify({ data: [] }));
  });
});
