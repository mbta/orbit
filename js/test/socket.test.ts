import { reload } from "../browser";
import { initSocket } from "../socket";
import { MetaDataKey } from "../util/metadata";
import { makeMockSocket } from "./helpers/socket";
import { Socket } from "phoenix";

jest.mock("../util/metadata", () => ({
  __esModule: true,
  getMetaContent: (field: MetaDataKey) => `${field} value`,
}));

jest.mock("phoenix", () => ({
  __esModule: true,
  Socket: jest.fn(),
}));

const mockSocket = Socket as jest.MockedClass<typeof Socket>;

describe("initSocket", () => {
  jest.spyOn(console, "warn").mockImplementation(() => {});

  test("loads without issue if everything is valid", () => {
    const { socket, onOpen, getChannel } = makeMockSocket();
    mockSocket.mockImplementationOnce(() => socket);
    initSocket();
    expect(mockSocket).toHaveBeenCalledWith("/socket", {
      params: {
        token: "guardianToken value",
        release: "release value",
      },
    });
    onOpen();
    const channel = getChannel("metadata")!;
    expect(channel.channel.join).toHaveBeenCalled();
    channel.joinReceive("ok", {
      authenticated: true,
      server_release: "release value",
    });
    expect(reload).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
  });

  test("reloads if auth fails", () => {
    const { socket, onOpen, getChannel } = makeMockSocket();
    mockSocket.mockImplementationOnce(() => socket);
    initSocket();
    onOpen();
    const channel = getChannel("metadata")!;
    channel.joinReceive("ok", {
      authenticated: false,
      server_release: "release value",
    });
    expect(reload).toHaveBeenCalled();
    expect(console.warn).toHaveBeenCalled();
  });

  test("reloads if server version changes", () => {
    const { socket, onOpen, getChannel } = makeMockSocket();
    mockSocket.mockImplementationOnce(() => socket);
    initSocket();
    onOpen();
    const channel = getChannel("metadata")!;
    expect(channel.channel.join).toHaveBeenCalled();
    channel.joinReceive("ok", {
      authenticated: true,
      server_release: "newer release",
    });
    expect(reload).toHaveBeenCalled();
    expect(console.warn).toHaveBeenCalled();
  });

  test("doesn't reload if socket doesn't connect", () => {
    // phoenix will retry the connection but that's not our code so not tested here
    const { socket, onError } = makeMockSocket();
    mockSocket.mockImplementationOnce(() => socket);
    initSocket();
    onError();
    expect(reload).not.toHaveBeenCalled();
    expect(console.warn).toHaveBeenCalled();
  });
});
