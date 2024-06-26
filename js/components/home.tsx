import { OperatorSignInModal } from "./operatorSignIn/operatorSignInModal";
import { ReactElement } from "react";

export const Home = (): ReactElement => {
  return (
    <>
      <div className="text-3xl">
        🪐
        <span className="text-mbta-orange">O</span>
        <span className="text-mbta-red">r</span>
        <span className="text-mbta-blue">b</span>it
      </div>
      <OperatorSignInModal />
    </>
  );
};
