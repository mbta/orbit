import { useVehiclePositions } from "../../hooks/useVehiclePositions";
import { ReactElement } from "react";

export const Ladder = (): ReactElement => {
  const vehiclePositions = useVehiclePositions();

  return (
    <>
      Ladder Page.
      <div>Vehicle positions: {vehiclePositions}</div>
    </>
  );
};
