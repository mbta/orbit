import { useSocket } from "../contexts/socketContext";
import "../models/vehiclePosition";
import {
  Vehicle,
  VehicleDataMessage,
  vehicleFromVehicleData,
} from "../models/vehicle";
import { useChannel } from "./useChannel";

const parser = (message: VehicleDataMessage): Vehicle[] => {
  return message.data.entities.map((data) => vehicleFromVehicleData(data));
};

export const useVehicles = (): Vehicle[] | null => {
  const socket = useSocket();
  const result = useChannel({
    socket,
    topic: "vehicles",
    parser,
    event: "vehicles",
    RawData: VehicleDataMessage,
    defaultResult: null,
  });

  return result;
};
