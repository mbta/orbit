import { useSocket } from "../contexts/socketContext";
import "../models/vehiclePosition";
import { useDataWarnings } from "../contexts/dataWarningsContext";
import { dateTimeFromUnix, useNow } from "../dateTime";
import {
  Vehicle,
  VehicleDataMessage,
  vehicleFromVehicleData,
} from "../models/vehicle";
import { useChannel } from "./useChannel";
import { useCallback, useEffect, useEffectEvent, useState } from "react";

export const useVehicles = (): Vehicle[] | null => {
  const now = useNow("minute");
  const [, addWarning, removeWarning] = useDataWarnings();
  const [mostRecentTimestamp, setMostRecentTimestamp] = useState(
    now.toUnixInteger(),
  );
  const parser = useCallback((message: VehicleDataMessage): Vehicle[] => {
    setMostRecentTimestamp(message.data.timestamp);
    return message.data.entities.map((data) => vehicleFromVehicleData(data));
  }, []);
  const socket = useSocket();
  const result = useChannel({
    socket,
    topic: "vehicles",
    parser,
    event: "vehicles",
    RawData: VehicleDataMessage,
    defaultResult: null,
  });
  const checkForStaleData = useEffectEvent(() => {
    if (now.diff(dateTimeFromUnix(mostRecentTimestamp), "minute").minutes > 3) {
      addWarning("vehicle_positions_stale");
    } else {
      removeWarning("vehicle_positions_stale");
    }
  });

  useEffect(
    () => {
      checkForStaleData();
    },
    // Disabling this because it's due to outdated react-hooks lint rules
    // Remove when that library is updated
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [now],
  );

  return result;
};
