import { Channel, Push, PushStatus, Socket } from "phoenix";

export const makeMockSocket = (): {
  socket: jest.Mocked<Socket>;
  onOpen: () => void;
  onError: () => void;
  getChannel: (topic: string) => ReturnType<typeof makeMockChannel> | null;
} => {
  const onOpenCallbacks: Parameters<Socket["onOpen"]>[0][] = [];
  const onErrorCallbacks: Parameters<Socket["onError"]>[0][] = [];
  const channelsByTopic: Record<
    string,
    ReturnType<typeof makeMockChannel>
  > = {};
  const socket = {
    onOpen: jest.fn((callback) => {
      onOpenCallbacks.push(callback);
      return "MessageRef";
    }),
    onError: jest.fn((callback) => {
      onErrorCallbacks.push(callback);
      return "MessageRef";
    }),
    channel: jest.fn((topic: string, _chanParams?: object) => {
      const mockChannel = makeMockChannel();
      channelsByTopic[topic] = mockChannel;
      return mockChannel.channel;
    }),
    connect: jest.fn(),
  } as Partial<Socket> as jest.Mocked<Socket>;
  return {
    socket,
    onOpen: () => {
      // eslint-disable-next-line @typescript-eslint/no-misused-promises -- we only use synchronous callbacks here
      onOpenCallbacks.forEach((onOpen) => onOpen());
    },
    onError: () => {
      // @ts-expect-error -- wrong args for onError, but the real types are complex and not used anyway
      // eslint-disable-next-line @typescript-eslint/no-misused-promises -- we only use synchronous callbacks here
      onErrorCallbacks.forEach((onError) => onError("event", "transport", 0));
    },
    getChannel: (topic: string) => channelsByTopic[topic] ?? null,
  };
};

export const makeMockChannel = (): {
  channel: jest.Mocked<Channel>;
  joinReceive: (status: PushStatus, response: unknown) => void;
} => {
  const { push: joinPush, receive: joinReceive } = makeMockPush();
  const channel = {
    join: jest.fn(() => joinPush),
    on: jest.fn(),
    leave: jest.fn(),
  } as Partial<Channel> as jest.Mocked<Channel>;
  return {
    channel,
    joinReceive: joinReceive,
  };
};

const makeMockPush = (): {
  push: jest.Mocked<Push>;
  receive: (status: PushStatus, response: unknown) => void;
} => {
  const callbacks: [PushStatus, (response: unknown) => unknown][] = [];
  const push = {
    receive: (
      status: PushStatus,
      callback: (response?: unknown) => unknown,
    ) => {
      callbacks.push([status, callback]);
      return push;
    },
  } as jest.Mocked<Push>;
  return {
    push,
    receive: (status: PushStatus, response: unknown) => {
      callbacks.forEach(([callbackStatus, callback]) => {
        if (callbackStatus === status) {
          callback(response);
        }
      });
    },
  };
};
