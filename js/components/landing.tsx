import { paths } from "../paths";
import { Link } from "react-router";

export const LandingPage = () => {
  return (
    // TODO: refactor to use available MenuLink instead of manual Link + img
    // TODO: add quick /landing test to make sure links render
    <div className="mt-20 mx-auto w-96 flex flex-col justify-center">
      <p className="mb-5"> Which line would you like to view?</p>
      <Link
        to={paths.ladder}
        className="relative flex items-center justify-center text-center mb-5 h-10 border-2 border-gray-300 rounded-md hover:bg-gray-200"
      >
        <img src="/images/icon-red-line.svg" alt="" className="h-6 mr-2" />
        Red Line Train Locations
      </Link>
      <Link
        to={paths.operators}
        className="relative flex items-center justify-center text-center mb-5 h-10 border-2 border-gray-300 rounded-md hover:bg-gray-200"
      >
        <img src="/images/icon-blue-line.svg" alt="" className="h-6 mr-2" />
        Blue Line Fit-For-Duty Sign In
      </Link>
    </div>
  );
};
