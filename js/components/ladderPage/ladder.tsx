import { useVehiclePositions } from "../../hooks/useVehiclePositions";
import { Train } from "./train";
import { ReactElement } from "react";

export const Ladder = (): ReactElement => {
  const vehiclePositions = useVehiclePositions();

  return (
    <>
      Ladder Page.
      <Train route="Red-Ashmont" label="1742" />
      <Train route="Red-Ashmont" label="1752" highlight={true} />
      <Train route="Red-Ashmont" label="1873" />
      <Train route="Red-Ashmont" label="1922" />
      <Train route="Red-Ashmont" label="1926" />
      <br />
      <Train route="Red-Braintree" label="1701" />
      <Train route="Red-Braintree" label="1729" />
      <Train route="Red-Braintree" label="1838" highlight={true} />
      <Train route="Red-Braintree" label="1842" />
      <Train route="Red-Braintree" label="1877" />
      <Train route="Red-Braintree" label="1904" highlight={true} />
      <div>Vehicle positions: {vehiclePositions}</div>
    </>
  );
};
