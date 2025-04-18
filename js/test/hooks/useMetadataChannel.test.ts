import { reload } from "../../browser";
import { SocketProvider } from "../../contexts/socketContext";
import { useMetadataChannel } from "../../hooks/useMetadataChannel";
import { MetaDataKey } from "../../util/metadata";
import { makeMockSocket } from "../helpers/socket";
import { act, renderHook } from "@testing-library/react";
import { Socket } from "phoenix";

jest.mock("../../util/metadata", () => ({
  __esModule: true,
  getMetaContent: (field: MetaDataKey) => `${field} value`,
}));

jest.mock("phoenix", () => ({
  __esModule: true,
  Socket: jest.fn(),
}));

const mockSocket = Socket as jest.MockedClass<typeof Socket>;

describe("useMetadataChannel", () => {
  jest.spyOn(console, "warn").mockImplementation(() => {});
  jest.spyOn(console, "error").mockImplementation(() => {});

  test("loads without issue if everything is valid", () => {
    const { socket, onOpen, getChannel } = makeMockSocket();
    mockSocket.mockImplementationOnce(() => socket);

    renderHook(() => useMetadataChannel(), {
      wrapper: SocketProvider,
    });
    expect(mockSocket).toHaveBeenCalledWith("/socket", {
      params: {
        token: "guardianToken value",
        release: "release value",
      },
    });
    onOpen();
    const channel = getChannel("metadata")!;
    expect(channel.channel.join).toHaveBeenCalled();
    act(() => {
      channel.joinReceive("ok", {
        authenticated: true,
        server_release: "release value",
      });
    });
    expect(reload).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
  });

  test("reloads if auth fails", () => {
    const { socket, onOpen, getChannel } = makeMockSocket();
    mockSocket.mockImplementationOnce(() => socket);
    renderHook(() => useMetadataChannel(), {
      wrapper: SocketProvider,
    });
    onOpen();
    const channel = getChannel("metadata")!;
    act(() => {
      channel.joinReceive("ok", {
        authenticated: false,
        server_release: "release value",
      });
    });
    expect(reload).toHaveBeenCalled();
    expect(console.warn).toHaveBeenCalled();
  });

  test("reloads if server version changes", () => {
    const { socket, onOpen, getChannel } = makeMockSocket();
    mockSocket.mockImplementationOnce(() => socket);
    renderHook(() => useMetadataChannel(), {
      wrapper: SocketProvider,
    });
    onOpen();
    const channel = getChannel("metadata")!;
    expect(channel.channel.join).toHaveBeenCalled();
    act(() => {
      channel.joinReceive("ok", {
        authenticated: true,
        server_release: "newer release",
      });
    });
    expect(reload).toHaveBeenCalled();
    expect(console.warn).toHaveBeenCalled();
  });

  test("doesn't reload if socket doesn't connect", () => {
    const { socket } = makeMockSocket();
    mockSocket.mockImplementationOnce(() => socket);
    renderHook(() => useMetadataChannel(), {
      wrapper: SocketProvider,
    });
    expect(reload).not.toHaveBeenCalled();
  });

  test("doesn't reload if channel doesn't join", () => {
    const { socket, onOpen, getChannel } = makeMockSocket();
    mockSocket.mockImplementationOnce(() => socket);
    renderHook(() => useMetadataChannel(), {
      wrapper: SocketProvider,
    });
    expect(reload).not.toHaveBeenCalled();

    onOpen();
    const channel = getChannel("metadata")!;

    act(() => {
      channel.joinReceive("error", {
        authenticated: true,
        server_release: "newer release",
      });
    });
    expect(reload).not.toHaveBeenCalled();
  });
});
