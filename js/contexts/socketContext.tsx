import { canReachOrbit, reload } from "../browser";
import { usePageVisibility } from "../hooks/usePageVisibility";
import { getMetaContent } from "../util/metadata";
import { Channel, Socket } from "phoenix";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { z } from "zod";

const SocketContext = createContext<Socket | null>(null);

/**
 * Maintain a Phoenix.Channel connection (disconnecting when the page is not visible).
 * The returned channel has not joined yet, so callers must `.join().receive(...)` themselves.
 * This function will handle leaving the channel when the effect is unmounted; callers should not call `.leave()` themselves.
 * The channel will change its identity when the topic changes or when the page visibility changes (it will be null while the page is invisible).
 * WARNING: If you join a channel which is already joined, the existing subscription will be silently replaced, which is not what you want.
 */
export const useRawChannel = ({
  actuallyConnect = true,
  joinParams,
  topic,
}: {
  actuallyConnect?: boolean;
  joinParams?: object;
  topic: string;
}): Channel | null => {
  const socket = useSocket();
  const [[channel, channelTopic], setChannelAndTopic] = useState<
    [Channel | null, string]
  >([null, topic]);
  const visible: boolean = usePageVisibility();
  useEffect(() => {
    if (visible && actuallyConnect && socket !== null) {
      const channel = socket.channel(topic, joinParams);

      // Reload our session if the auth has expired
      channel.on("auth_expired", () => {
        reload();
      });

      setChannelAndTopic([channel, topic]);

      return () => {
        channel.leave();
        setChannelAndTopic([null, topic]);
      };
    }
  }, [topic, joinParams, socket, visible, actuallyConnect]);

  // if topic has changed and channel is stale, don't return channel at all
  return channelTopic === topic ? channel : null;
};

/**
 * Maintain and remember the last value from a Phoenix.Channel connection.
 * Assumes that the response from joining the channel has the same structure and meaning as the value passed alongside the given event.
 * WARNING: if event or parser changes without topic also changing, Phoenix will throw an error.
 * WARNING: If you join a channel which is already joined, the existing subscription will be silently replaced, which is not what you want.
 */
export const useChannel = <RawData, Data>({
  actuallyConnect = true,
  topic,
  event,
  RawData,
  parser,
  defaultResult,
}: {
  actuallyConnect?: boolean;
  topic: string;
  event: string;
  RawData: z.ZodType<RawData>;
  parser: (rawData: RawData) => Data;
  defaultResult: Data | (() => Data);
}): Data => {
  const channel = useRawChannel({ actuallyConnect, topic });
  const [data, setData] = useState<Data>(defaultResult);
  useEffect(() => {
    if (channel !== null) {
      joinAndSubscribe<RawData>(channel, event, RawData, (rawData) => {
        setData(parser(rawData));
      });
    }
  }, [topic, event, channel, parser, RawData]);
  return data;
};

export const SocketProvider = ({ children }: { children?: ReactNode }) => {
  const socket = useMemo((): Socket => {
    const initialSocket = new Socket("/socket", {
      params: {
        release: getMetaContent("release"),
        token: getMetaContent("guardianToken"),
      },
    });
    initialSocket.connect();
    // the error itself doesn't distinguish between a network failure and a 403 Forbidden
    initialSocket.onError(() => {
      canReachOrbit().then(
        (online) => {
          if (online) {
            // Orbit is up, we're just rejected, presumably for auth or version reasons
            reload();
          } else {
            // Orbit or the user's internet is down, so don't reload
          }
        },
        (e: unknown) => {
          console.error("canReachOrbit", e);
        },
      );
    });
    return initialSocket;
  }, []);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};

export const isReachable = (channel: Channel | null): Promise<boolean> => {
  if (channel === null) {
    return Promise.resolve(false);
  }

  return new Promise((resolve) => {
    // eslint-disable-next-line better-mutation/no-mutating-methods
    channel
      .push("health", {}, 1000)
      .receive("ok", () => {
        resolve(true);
      })
      .receive("error", () => {
        resolve(false);
      })
      .receive("timeout", () => {
        resolve(false);
      });
  });
};

const joinAndSubscribe = <RawData,>(
  channel: Channel,
  event: string,
  RawData: z.ZodType<RawData>,
  handleData: (rawData: RawData) => void,
) => {
  const handleRawData = (rawData: unknown) => {
    // uncompress would go here if we decided to gzip down the line
    const data = RawData.parse(rawData);
    handleData(data);
  };

  channel.on(event, handleRawData);

  channel
    .join()
    .receive("ok", handleRawData)
    .receive("error", (error) => {
      console.error("join failed", error);
    })
    .receive("timeout", () => {
      reload();
    });
};

export const useSocket = (): Socket | null => useContext(SocketContext);
