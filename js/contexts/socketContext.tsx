import { reload } from "../browser";
import { join } from "../util/channel";
import { getMetaContent } from "../util/metadata";
import { Socket } from "phoenix";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { z } from "zod";

const SocketContext = createContext<Socket | null>(null);

const MetadataJoinResponse = z.object({
  authenticated: z.boolean(),
  server_release: z.string(),
});

export const SocketProvider = ({ children }: { children?: ReactNode }) => {
  const [readySocket, setReadySocket] = useState<Socket | null>(null);

  useEffect(() => {
    const clientRelease = getMetaContent("release");
    const initialSocket = new Socket("/socket", {
      params: {
        release: clientRelease,
        token: getMetaContent("guardianToken"),
      },
    });
    initialSocket.connect();

    initialSocket.onError((err) => {
      console.error(err);
    });
    const metadataChannel = initialSocket.channel("metadata");

    join(metadataChannel, MetadataJoinResponse, (response) => {
      if (clientRelease !== response.server_release) {
        console.warn(
          `Server has version ${response.server_release} but we have version ${clientRelease}. Reloading.`,
        );
        reload();
      } else if (!response.authenticated) {
        console.warn("Authentication failed. Reloading.");
        reload();
      }

      setReadySocket(initialSocket);
    });
  }, []);

  return (
    <SocketContext.Provider value={readySocket}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = (): Socket | null => useContext(SocketContext);
