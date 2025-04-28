import { reload } from "../browser";
import { Channel } from "phoenix";
import { z } from "zod";

export const join = <RawData>(
  channel: Channel,
  RawData: z.ZodType<RawData>,
  handleData: (rawData: RawData) => void,
  event?: string,
) => {
  const handleRawData = (rawData: unknown) => {
    // uncompress would go here if we decided to gzip down the line
    const data = RawData.parse(rawData);
    handleData(data);
  };

  if (event !== undefined) {
    channel.on(event, handleRawData);
  }

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
