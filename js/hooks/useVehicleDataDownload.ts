import { Vehicle } from "../models/vehicle";
import { useEffect, useState } from "react";

export type VehicleDataDownload = {
  linkTarget: string;
  fileName: string;
};

export const useVehicleDataDownload = (
  vehicle: Vehicle,
): VehicleDataDownload => {
  const [linkTarget, setLinkTarget] = useState("");
  const timestamp = new Date().toISOString();
  const fileName = `vehicle-${vehicle.vehiclePosition.vehicleId}-${timestamp}.json`;
  useEffect(() => {
    const json = JSON.stringify(vehicle, null, 4);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    setLinkTarget(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [vehicle]);
  return { linkTarget, fileName };
};
