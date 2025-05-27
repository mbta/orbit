import { paths } from "../paths";
import { Link } from "react-router";

export const LandingPage = () => {
  return (
    <div className="mt-20 mx-auto w-96 flex flex-col justify-center">
      <p className="mb-5"> Which line would you like to view?</p>

      <div className="relative flex items-center justify-center text-center mb-5 h-10 border-2 border-gray-300 rounded-md hover:bg-gray-200">
        <img
          src="/images/icon-red-line.svg"
          alt="Red Line Icon"
          className="h-6 mr-2"
        />
        <Link to={paths.ladder}>Red Line Train Locations</Link>
      </div>
      <div className="relative flex items-center justify-center text-center mb-5 h-10 border-2 border-gray-300 rounded-md hover:bg-gray-200">
        <img
          src="/images/icon-blue-line.svg"
          alt="Blue Line Icon"
          className="h-6 mr-2"
        />
        <Link to={paths.operators}>Blue Line Fit-For-Duty Sign In</Link>
      </div>
    </div>
  );
};
