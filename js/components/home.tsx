import { List } from "./operatorSignIn/list";
import { OperatorSignInModal } from "./operatorSignIn/operatorSignInModal";
import { DateTime } from "luxon";
import { ReactElement, useMemo, useState } from "react";

export const Home = (): ReactElement => {
  const [modalOpen, setModalOpen] = useState(false);
  // check once to avoid it changing while looking at the page
  // no attempt yet to verify time zones / rolling the date at a time other than midnight
  const today = useMemo<string>(() => DateTime.now().toISODate(), []);
  const [selectedDate, setSelectedDate] = useState<string>(today);
  return (
    <main className="text-gray-500">
      <section className="max-w-lg mx-auto px-2 py-5">
        <hgroup className="mb-5">
          <h1 className="text-[28px] font-semibold">Operators</h1>
          <p>Search and sign in operators</p>
        </hgroup>
        <button
          className="w-full rounded bg-gray-500 hover:bg-gray-400 text-white font-semibold p-1 h-10"
          onClick={() => {
            setModalOpen(true);
          }}
        >
          Sign In Operator
        </button>
      </section>
      <section className="w-full bg-gray-100/50 py-5">
        <form action="/sign-in-export" method="get" target="_blank">
          <div className="mx-auto max-w-lg px-2">
            <p className="font-semibold">Export sign in records</p>
          </div>
          <div className="mt-5 flex justify-between gap-4 items-end mb-3 max-w-lg mx-auto px-2">
            <label className="flex flex-grow flex-col">
              <span className="text-sm">Service Date</span>
              <input
                type="date"
                name="date"
                value={selectedDate}
                onChange={(evt) => {
                  setSelectedDate(evt.target.value);
                }}
                className="rounded h-10 bg-gray-100"
              />
            </label>
            <button
              className="rounded border border-gray-300 hover:bg-gray-100 p-2 h-10"
              type="submit"
            >
              Export Records
            </button>
          </div>
        </form>
      </section>
      <section className="max-w-lg mx-auto px-2 py-5">
        <p className="font-semibold mb-3">Today&apos;s sign ins</p>
        <List line="blue" />
      </section>

      <OperatorSignInModal
        show={modalOpen}
        close={() => {
          setModalOpen(false);
        }}
      />
    </main>
  );
};
