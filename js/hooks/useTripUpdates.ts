import { useSocket } from "../contexts/socketContext";
import {
  TripUpdate,
  tripUpdateFromData,
  TripUpdatesMessage,
} from "../models/tripUpdate";
import { useChannel } from "./useChannel";

const parser = (message: TripUpdatesMessage): TripUpdate[] => {
  return message.data.entities.map(tripUpdateFromData);
};

export const useTripUpdates = (): TripUpdate[] | null => {
  const socket = useSocket();
  const result = useChannel({
    socket,
    topic: "trip_updates",
    parser,
    event: "trip_updates",
    RawData: TripUpdatesMessage,
    defaultResult: null,
  });

  return result;
};
