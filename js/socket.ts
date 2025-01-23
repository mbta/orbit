import { reload } from "./browser";
import { getMetaContent } from "./util/metadata";
import { Socket } from "phoenix";
import { z } from "zod";

export const initSocket = () => {
  const clientRelease = getMetaContent("release");
  const socket = new Socket("/socket", {
    params: {
      release: clientRelease,
      token: getMetaContent("guardianToken"),
    },
  });

  socket.onError((_error, _transport, _establishedConnections) => {
    console.warn("socket error");
  });

  socket.onOpen(() => {
    socket
      .channel("metadata")
      .join()
      .receive("ok", (rawResponse: unknown) => {
        const { authenticated, server_release: serverRelease } =
          MetadataJoinResponse.parse(rawResponse);
        if (serverRelease !== clientRelease) {
          console.warn(
            `Server has version ${serverRelease} but we have version ${clientRelease}. Reloading.`,
          );
          reload();
        }
        if (!authenticated) {
          console.warn("Authentication failed. Reloading.");
          reload();
        }
        // channel successfully joined
      })
      .receive("timeout", (response: unknown) => {
        console.warn("channel timeout");
        console.warn(response);
      })
      .receive("error", (response: unknown) => {
        console.error("channel error");
        console.error(response);
      });
  });

  socket.connect();
};

const MetadataJoinResponse = z.object({
  authenticated: z.boolean(),
  server_release: z.string(),
});
