import { DataWarningsProvider } from "../../contexts/dataWarningsContext";
import { useChannel } from "../../hooks/useChannel";
import { useVehicles } from "../../hooks/useVehicles";
import { renderHook } from "@testing-library/react";

jest.mock("../../hooks/useChannel", () => ({
  __esModule: true,
  useChannel: jest.fn(),
}));
const mockUseChannel = useChannel as jest.MockedFunction<typeof useChannel>;

describe("useVehicles", () => {
  beforeAll(() => {
    mockUseChannel.mockReturnValue({
      data: [],
    });
  });
  test("subscribes to the proper topic with requested line filter", () => {
    renderHook(() => useVehicles("Red"), { wrapper: DataWarningsProvider });
    expect(mockUseChannel).toHaveBeenCalledWith(
      expect.objectContaining({
        topic: "vehicles",
        event: "vehicles",
        joinParams: {
          line: "Red",
        },
      }),
    );
  });
  test("joins with the requested line filter for other lines", () => {
    renderHook(() => useVehicles("Blue"), { wrapper: DataWarningsProvider });
    expect(mockUseChannel).toHaveBeenCalledWith(
      expect.objectContaining({
        topic: "vehicles",
        event: "vehicles",
        joinParams: {
          line: "Blue",
        },
      }),
    );
  });
});
