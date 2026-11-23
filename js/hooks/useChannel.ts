import { join } from "../util/channel";
import { usePageVisibility } from "./usePageVisibility";
import { Channel, Socket } from "phoenix";
import { useEffect, useState } from "react";
import { z } from "zod";

/**
 * Maintain a Phoenix.Channel connection (disconnecting when the page is not visible).
 * The returned channel has not joined yet, so callers must `.join().receive(...)` themselves.
 * This function will handle leaving the channel when the effect is unmounted; callers should not call `.leave()` themselves.
 * The channel will change its identity when the topic changes or when the page visibility changes (it will be null while the page is invisible).
 * WARNING: If you join a channel which is already joined, the existing subscription will be silently replaced, which is not what you want.
 */
export const useRawChannel = ({
  socket,
  joinParams,
  topic,
}: {
  socket: Socket | null;
  joinParams?: object;
  topic: string;
}): Channel | null => {
  const [[channel, channelTopic], setChannelAndTopic] = useState<
    [Channel | null, string]
  >([null, topic]);
  const visible: boolean = usePageVisibility();
  useEffect(() => {
    if (visible && socket !== null) {
      const channel = socket.channel(topic, joinParams);
      setChannelAndTopic([channel, topic]);

      return () => {
        channel.leave();
        setChannelAndTopic([null, topic]);
      };
    }
  }, [topic, joinParams, socket, visible]);

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
  socket,
  topic,
  event,
  RawData,
  parser,
  defaultResult,
}: {
  socket: Socket | null;
  topic: string;
  event: string;
  RawData: z.ZodType<RawData>;
  parser: (rawData: RawData) => Data;
  defaultResult: Data | (() => Data);
}): Data => {
  const channel = useRawChannel({ socket, topic });
  const [data, setData] = useState<Data>(defaultResult);
  useEffect(() => {
    if (channel !== null) {
      join(
        channel,
        RawData,
        (rawData) => {
          setData(parser(rawData));
        },
        event,
      );
    }
  }, [topic, event, channel, parser, RawData]);
  return data;
};
