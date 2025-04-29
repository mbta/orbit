import { useSocket } from "../contexts/socketContext";
import {
  VehiclePosition,
  vehiclePositionFromData,
  VehiclePositionMessage,
} from "../models/vehiclePosition";
import { useChannel } from "./useChannel";

const parser = (message: VehiclePositionMessage): VehiclePosition[] => {
  return message.data.entities.map(vehiclePositionFromData);
};

export const useVehiclePositions = (): VehiclePosition[] | null => {
  const socket = useSocket();
  const result = useChannel({
    socket,
    topic: "train_locations",
    parser,
    event: "vehicle_positions",
    RawData: VehiclePositionMessage,
    defaultResult: null,
  });

  return result;
};
