import { DataWarningsProvider } from "../../contexts/dataWarningsContext";
import { useSocket } from "../../contexts/socketContext";
import { useVehicles } from "../../hooks/useVehicles";
import { makeMockSocket } from "../helpers/socket";
import { renderHook } from "@testing-library/react";

jest.mock("../../contexts/socketContext", () => ({
  __esModule: true,
  useSocket: jest.fn(),
}));
const mockUseSocket = useSocket as jest.MockedFunction<typeof useSocket>;

describe("useVehicles", () => {
  const { socket, getChannel } = makeMockSocket();

  beforeEach(() => {
    mockUseSocket.mockReturnValue(socket);
  });

  test("subscribes to the proper topic", () => {
    renderHook(() => useVehicles("Red"), { wrapper: DataWarningsProvider });
    expect(socket.channel).toHaveBeenCalledWith("vehicles", expect.anything());
    expect(getChannel("vehicles")?.channel.on).toHaveBeenCalledWith(
      "vehicles",
      expect.anything(),
    );
  });

  test("joins with the requested line filter", () => {
    renderHook(() => useVehicles("Red"), { wrapper: DataWarningsProvider });
    expect(socket.channel).toHaveBeenCalledWith("vehicles", { line: "Red" });
    // the join params must be stable, or the channel is re-joined on every render
    expect(socket.channel).toHaveBeenCalledTimes(1);
  });

  test("joins with the requested line filter for other lines", () => {
    renderHook(() => useVehicles("Blue"), { wrapper: DataWarningsProvider });
    expect(socket.channel).toHaveBeenCalledWith("vehicles", { line: "Blue" });
  });
});
