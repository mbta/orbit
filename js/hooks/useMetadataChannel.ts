import { reload } from "../browser";
import { useChannel } from "../contexts/socketContext";
import { getMetaContent } from "../util/metadata";
import { useEffect } from "react";
import { z } from "zod";

const MetadataJoinResponse = z.object({
  authenticated: z.boolean(),
  server_release: z.string(),
});

const parser = (data: unknown) => {
  return MetadataJoinResponse.parse(data);
};

export const MetadataChannel = () => {
  useMetadataChannel();
  return null;
};

export const useMetadataChannel = () => {
  const result = useChannel({
    actuallyConnect: true,
    topic: "metadata",
    parser,
    event: "", // Only listening to the join response
    RawData: MetadataJoinResponse,
    defaultResult: null,
  });

  const clientRelease = getMetaContent("release");

  useEffect(() => {
    if (result === null) {
      return;
    }

    if (clientRelease !== result.server_release) {
      console.warn(
        `Server has version ${result.server_release} but we have version ${clientRelease}. Reloading.`,
      );
      reload();
    } else if (!result.authenticated) {
      console.warn("Authentication failed. Reloading.");
      reload();
    }
  }, [result, clientRelease]);

  return result;
};
