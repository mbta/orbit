import { OperatorSignInModal } from "./operatorSignIn/operatorSignInModal";
import { ReactElement } from "react";
import { Link } from "react-router-dom";

export const Home = (): ReactElement => {
  return (
    <>
      <div className="text-3xl">
        🪐
        <span className="text-mbta-orange">O</span>
        <span className="text-mbta-red">r</span>
        <span className="text-mbta-blue">b</span>it
        <div>
          <Link to="/list">
            <button className="bg-mbta-blue text-gray-100 rounded-md p-2 text-sm m-5">
              Sign-in history
            </button>
          </Link>
        </div>
      </div>
      <OperatorSignInModal />
    </>
  );
};
