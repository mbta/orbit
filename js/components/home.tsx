import { OperatorSignInModal } from "./operatorSignIn/operatorSignInModal";
import { DateTime } from "luxon";
import { ReactElement, useMemo, useState } from "react";
import { Link } from "react-router-dom";

export const Home = (): ReactElement => {
  const [modalOpen, setModalOpen] = useState(false);
  // check once to avoid it changing while looking at the page
  // no attempt yet to verify time zones / rolling the date at a time other than midnight
  const today = useMemo<string>(() => DateTime.now().toISODate(), []);
  const [selectedDate, setSelectedDate] = useState<string>(today);
  return (
    <div className="max-w-lg mx-auto">
      <div className="flex justify-between">
        <hgroup className="mb-3">
          <h1 className="text-xl">Operators</h1>
          <p>Search and sign in operators</p>
        </hgroup>
        <button
          className="rounded bg-gray-500 hover:bg-gray-400 text-white p-1 self-center"
          onClick={() => {
            setModalOpen(true);
          }}
        >
          Sign In Operator
        </button>
      </div>
      <div className="flex justify-between gap-2 items-end mb-3">
        <label className="flex flex-col">
          <span className="text-sm">Service Date</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(evt) => {
              setSelectedDate(evt.target.value);
            }}
            className="rounded"
          />
        </label>
        <button
          className="rounded border border-gray-300 hover:bg-gray-50 px-2 py-1 disabled:text-gray-300"
          disabled={selectedDate === today}
          onClick={() => {
            setSelectedDate(today);
          }}
        >
          Today
        </button>
        <button
          className="rounded border border-gray-300 hover:bg-gray-50 px-2 py-1"
          onClick={() => {
            console.log("TODO");
          }}
        >
          Export Records
        </button>
      </div>
      <p className="mb-3">(Search will go here)</p>
      <Link className="block" to="/list">
        <button className="bg-mbta-blue text-gray-100 rounded-md p-2 text-sm">
          Sign-in history
        </button>
      </Link>
      <OperatorSignInModal
        show={modalOpen}
        close={() => {
          setModalOpen(false);
        }}
      />
    </div>
  );
};
