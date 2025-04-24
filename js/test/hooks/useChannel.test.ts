import { SocketProvider } from "../../contexts/socketContext";
import { useChannel } from "../../hooks/useChannel";
import { renderHook } from "@testing-library/react";
import { Socket } from "phoenix";
import { z } from "zod";

describe("useChannel", () => {
  test("calls channel.join()", () => {
    const socket = new Socket("/test");
    const channel = socket.channel("topic");

    const RawData = z.string();
    const parser = (data: unknown): string => data as string;
    renderHook(
      () =>
        useChannel({
          socket,
          topic: "topic",
          event: "event",
          RawData,
          parser,
          defaultResult: null,
        }),
      {
        wrapper: SocketProvider,
      },
    );
    expect(channel.join).toHaveBeenCalled();
  });

  test("useChannel hook returns null when loading", () => {
    const socket = new Socket("/test");

    const RawData = z.string();
    const parser = (data: unknown): string => data as string;
    const { result } = renderHook(
      () =>
        useChannel({
          socket,
          topic: "topic",
          event: "event",
          RawData,
          parser,
          defaultResult: null,
        }),
      {
        wrapper: SocketProvider,
      },
    );
    expect(result.current).toBeNull();
  });
});
