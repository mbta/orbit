import { reload } from "../../browser";
import { SocketProvider, useSocket } from "../../contexts/socketContext";
import { getMetaContent, MetaDataKey } from "../../util/metadata";
import { renderHook } from "@testing-library/react";
import { Socket } from "phoenix";

jest.mock("../../util/metadata", () => ({
  getMetaContent: jest
    .fn()
    .mockImplementation((field: MetaDataKey): string | null => {
      if (field === "release") {
        return "2050-04-24-1";
      }
      return null;
    }),
}));

describe("SocketProvider", () => {
  beforeAll(() => {
    const socket = new Socket("/test");
    const mockChannel = socket.channel("topic");
    const mockPush = mockChannel.join();
    jest.mocked(mockPush.receive).mockImplementation((message, handler) => {
      if (message === "ok") {
        handler({
          authenticated: true,
          server_release: "2050-04-24-1",
        });
      }
      return mockPush;
    });
  });

  test("constructs a socket", () => {
    renderHook(useSocket, {
      wrapper: SocketProvider,
    });

    expect(Socket).toHaveBeenCalled();
  });

  test("connects", () => {
    const socket = new Socket("/test");
    renderHook(useSocket, {
      wrapper: SocketProvider,
    });

    expect(socket.connect).toHaveBeenCalled();
  });

  test("joins metadata channel", () => {
    const socket = new Socket("/test");
    const mockChannel = socket.channel("topic");

    renderHook(useSocket, {
      wrapper: SocketProvider,
    });

    expect(mockChannel.join).toHaveBeenCalled();
  });

  test("reloads on version mismatch", () => {
    jest.spyOn(console, "warn").mockImplementation(() => {});
    const socket = new Socket("/test");
    const mockChannel = socket.channel("topic");
    const mockPush = mockChannel.join();
    jest.mocked(mockPush.receive).mockImplementation((message, handler) => {
      if (message === "ok") {
        handler({
          authenticated: true,
          server_release: "2050-04-24-1",
        });
      }
      return mockPush;
    });

    jest
      .mocked(getMetaContent)
      .mockImplementation((field: MetaDataKey): string | null => {
        if (field === "release") {
          return "2025-04-24";
        }
        return null;
      });

    renderHook(useSocket, {
      wrapper: SocketProvider,
    });
    expect(reload).toHaveBeenCalled();
  });

  test("doesn't reload on version match", () => {
    const socket = new Socket("/test");
    const mockChannel = socket.channel("topic");
    const mockPush = mockChannel.join();
    jest.mocked(mockPush.receive).mockImplementation((message, handler) => {
      if (message === "ok") {
        handler({
          authenticated: true,
          server_release: "2050-04-24-1",
        });
      }
      return mockPush;
    });

    jest
      .mocked(getMetaContent)
      .mockImplementation((field: MetaDataKey): string | null => {
        if (field === "release") {
          return "2050-04-24-1";
        }
        return null;
      });

    renderHook(useSocket, {
      wrapper: SocketProvider,
    });
    expect(reload).not.toHaveBeenCalled();
  });
});
