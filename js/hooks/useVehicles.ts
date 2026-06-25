import { useSocket } from "../contexts/socketContext";
import "../models/vehiclePosition";
import { DataWarning, useDataWarnings } from "../contexts/dataWarningsContext";
import { dateTimeFromUnix, useNow } from "../dateTime";
import {
  Vehicle,
  VehicleDataMessage,
  vehicleFromVehicleData,
} from "../models/vehicle";
import { useChannel } from "./useChannel";
import { useEffect, useState } from "react";

export const useVehicles = (): Vehicle[] | null => {
  const now = useNow("minute");
  const [, setWarnings] = useDataWarnings();
  const [mostRecentTimestamp, setMostRecentTimestamp] = useState(
    now.toUnixInteger(),
  );
  const socket = useSocket();
  const result = useChannel({
    socket,
    topic: "vehicles",
    parser: (message: VehicleDataMessage): Vehicle[] => {
      setMostRecentTimestamp(message.data.timestamp);
      return message.data.entities.map((data) => vehicleFromVehicleData(data));
    },
    event: "vehicles",
    RawData: VehicleDataMessage,
    defaultResult: null,
  });
  useEffect(() => {
    setWarnings((warnings: DataWarning) => ({
      ...warnings,
      VEHICLE_POSITIONS_STALE:
        now &&
        now.diff(dateTimeFromUnix(mostRecentTimestamp), "minute").minutes > 3,
    }));
  }, [now]);

  return result;
};
