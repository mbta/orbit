import "@testing-library/jest-dom";
import { neverPromise } from "./helpers/promiseWithResolvers";
// add all jest-extended matchers
import * as jestExtendedMatchers from "jest-extended";
import { Channel, Push, Socket } from "phoenix";

expect.extend(jestExtendedMatchers);

// always prevent these side-effects from being called in tests
jest.mock("../browser", () => ({
  fetch: jest.fn(() => neverPromise()),
  reload: jest.fn(),
}));

jest.mock("phoenix", () => {
  const mockPush: Push = {
    receive: jest.fn(),
  } as Partial<Push> as Push;
  // allow chaining
  (mockPush.receive as jest.Mock).mockImplementation(() => mockPush);

  const mockChannel: Channel = {
    join: jest.fn(() => mockPush),
    leave: jest.fn(),
    on: jest.fn(),
  } as Partial<Channel> as Channel;

  const mockSocket: Socket = {
    channel: jest.fn(() => mockChannel),
    connect: jest.fn(),
    onOpen: jest.fn(),
    onError: jest.fn(),
    onClose: jest.fn(),
    off: jest.fn(),
  } as Partial<Socket> as Socket;

  return {
    __esModule: true,
    Socket: jest.fn(() => mockSocket),
  };
});
