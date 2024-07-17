import { post } from "../../api";
import { findEmployeeByBadge, useEmployees } from "../../hooks/useEmployees";
import { nfcSupported } from "../../util/nfc";
import { Modal } from "../modal";
import { Attestation } from "./attestation";
import { Error, Success } from "./complete";
import { OperatorSelection } from "./operatorSelection";
import { BadgeEntry } from "./types";
import { DateTime } from "luxon";
import { ReactElement, useEffect, useState } from "react";

enum CompleteState {
  SUCCESS,
  ERROR,
}

const submit = (
  badgeEntry: BadgeEntry,
  setComplete: React.Dispatch<React.SetStateAction<CompleteState | null>>,
  setLoading: React.Dispatch<React.SetStateAction<boolean>>,
) => {
  setLoading(true);

  post("/api/signin", {
    signed_in_employee_badge: badgeEntry.number,
    signed_in_at: DateTime.now().toUnixInteger(),
    line: "blue",
    method: badgeEntry.method,
  })
    .then((response) => {
      if (!response.ok) {
        console.error(response.status, response.statusText);
        setComplete(CompleteState.ERROR);
      } else {
        setComplete(CompleteState.SUCCESS);
      }
    })
    .catch((err: unknown) => {
      console.error(err);
      setComplete(CompleteState.ERROR);
    })
    .finally(() => {
      setLoading(false);
    });
};

export const OperatorSignInModal = (): ReactElement => {
  const [show, setShow] = useState<boolean>(true);
  const [badge, setBadge] = useState<BadgeEntry | null>(null);
  const [complete, setComplete] = useState<CompleteState | null>(null);

  const [loading, setLoading] = useState<boolean>(false);

  const employees = useEmployees();

  // Hide modal after timer on success
  useEffect(() => {
    if (complete === CompleteState.SUCCESS) {
      const timeout = setTimeout(() => {
        setShow(false);
      }, 1000);
      return () => {
        clearTimeout(timeout);
      };
    }
  }, [complete]);

  const employee =
    employees.status === "ok" &&
    badge !== null &&
    findEmployeeByBadge(employees.result, badge.number);
  const name = employee ? employee.first_name : `Operator ${badge?.number}`;

  return (
    <Modal
      show={show}
      title={<span className="text-lg font-bold">Fit for Duty Check</span>}
      onClose={() => {
        setShow(false);
      }}
    >
      {complete === CompleteState.ERROR && badge !== null ?
        <Error
          name={name}
          loading={loading}
          onTryAgain={() => {
            submit(badge, setComplete, setLoading);
          }}
        />
      : complete === CompleteState.SUCCESS && badge !== null ?
        <Success name={name} />
      : badge === null ?
        <OperatorSelection
          nfcSupported={nfcSupported()}
          onOK={setBadge}
          employees={employees}
        />
      : <Attestation
          badge={badge.number}
          loading={loading}
          onComplete={() => {
            submit(badge, setComplete, setLoading);
          }}
          employees={employees}
        />
      }
    </Modal>
  );
};
