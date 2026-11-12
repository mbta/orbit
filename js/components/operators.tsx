import { List } from "./operatorSignIn/list";
import { OperatorSignInModal } from "./operatorSignIn/operatorSignInModal";
import { DateTime } from "luxon";
import { Button } from "rail-tech-ui";
import { ReactElement, useMemo, useState } from "react";

export const Operators = (): ReactElement => {
  const [modalOpen, setModalOpen] = useState(false);

  // Keep track of sign-in count. When this changes, we re-render
  //  the List component (and therefore re-download the list of sign-ins)
  const [signInCount, setSignInCount] = useState(0);

  // check once to avoid it changing while looking at the page
  // no attempt yet to verify time zones / rolling the date at a time other than midnight
  const today = useMemo<string>(() => DateTime.now().toISODate(), []);
  const [selectedDate, setSelectedDate] = useState<string>(today);
  return (
    <main className="light:text-text-primary-light dark:text-text-primary-dark relative">
      <section className="max-w-lg mx-auto px-2 py-5">
        <hgroup className="mb-5">
          <h1 className="text-[28px] font-semibold">Operators</h1>
          <p>Search and sign in operators</p>
        </hgroup>
        <Button
          type="primary"
          size="large"
          className="w-full"
          onClick={() => {
            setModalOpen(true);
          }}
        >
          Sign In Operator
        </Button>
      </section>
      <section className="w-full py-5 light:bg-text-tertiary-light dark:bg-text-tertiary-dark">
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
                className="w-full rounded h-10 dark:bg-inputField-search-background-dark dark:border-inputfield-search-background-dark light:border-inputField-search-background-light"
              />
            </label>
            <Button
              type="tertiary"
              size="large"
              className="h-10 p-2"
              onClick={"submit"}
            >
              Export Records
            </Button>
          </div>
        </form>
      </section>
      <section className="max-w-lg mx-auto px-2 py-5">
        <p className="font-semibold mb-3">Today&apos;s sign ins</p>
        <List key={signInCount} line="blue" />
      </section>

      <OperatorSignInModal
        show={modalOpen}
        onComplete={() => {
          setSignInCount((count) => count + 1);
        }}
        close={() => {
          setModalOpen(false);
        }}
      />
    </main>
  );
};
