import { ApiResult, post } from "../../api";
import { reload } from "../../browser";
import { useNow } from "../../dateTime";
import { useCertifications } from "../../hooks/useCertifications";
import { findEmployeeByBadge, useEmployees } from "../../hooks/useEmployees";
import { Certification, getExpired } from "../../models/certification";
import { EmployeeList } from "../../models/employee";
import { nfcSupported } from "../../util/nfc";
import { Modal } from "../modal";
import { Attestation } from "./attestation";
import {
  BadgeSerialLookupError,
  NfcScanError,
  SignInError,
  Success,
} from "./complete";
import { OperatorSelection } from "./operatorSelection";
import { BadgeEntry } from "./types";
import { captureException } from "@sentry/react";
import { DateTime } from "luxon";
import { ReactElement, useEffect, useState } from "react";

enum CompleteState {
  SUCCESS,
  SIGN_IN_ERROR,
  BADGE_SERIAL_LOOKUP_ERROR,
  NFC_SCAN_ERROR,
}

const submit = (
  badgeEntry: BadgeEntry,
  radio: string,
  bypass: Certification[],
  setComplete: React.Dispatch<React.SetStateAction<CompleteState | null>>,
  setLoading: React.Dispatch<React.SetStateAction<boolean>>,
  onComplete: () => void,
) => {
  setLoading(true);

  post("/api/signin", {
    bypass,
    signed_in_employee_badge: badgeEntry.number,
    signed_in_at: DateTime.now().toUnixInteger(),
    line: "blue",
    radio_number: radio,
    method: badgeEntry.method,
  })
    .then((response) => {
      if (!response.ok) {
        console.error(response.status, response.statusText);
        setComplete(CompleteState.SIGN_IN_ERROR);
      } else {
        onComplete();
        setComplete(CompleteState.SUCCESS);
      }
    })
    .catch((err: unknown) => {
      console.error(err);
      captureException(err);
      setComplete(CompleteState.SIGN_IN_ERROR);
    })
    .finally(() => {
      setLoading(false);
    });
};

export const OperatorSignInModal = ({
  show,
  onComplete,
  close,
}: {
  show: boolean;
  onComplete: () => void;
  close: () => void;
}): ReactElement => {
  const employees = useEmployees();

  return (
    <Modal
      show={show}
      title={<span className="text-lg font-bold">Fit for Duty Check</span>}
      onClose={() => {
        close();
      }}
    >
      <OperatorSignInModalContent
        employees={employees}
        onComplete={onComplete}
        close={close}
      />
    </Modal>
  );
};

const OperatorSignInModalContent = ({
  employees,
  onComplete,
  close,
}: {
  employees: ApiResult<EmployeeList>;
  onComplete: () => void;
  close: () => void;
}): ReactElement => {
  const [badge, setBadge] = useState<BadgeEntry | null>(null);
  const [radio, setRadio] = useState<string>("");
  const [complete, setComplete] = useState<CompleteState | null>(null);

  const [loading, setLoading] = useState<boolean>(false);

  const now = useNow("second");
  const certifications = useCertifications(badge?.number ?? null);

  // Hide modal after timer on success
  useEffect(() => {
    if (complete === CompleteState.SUCCESS) {
      const timeout = setTimeout(() => {
        close();
      }, 1000);
      return () => {
        clearTimeout(timeout);
      };
    }
  }, [complete, close]);

  const employee =
    employees.status === "ok" && badge !== null ?
      findEmployeeByBadge(employees.result, badge.number)
    : null;
  const name: string = employee?.first_name ?? `Operator ${badge?.number}`;

  const requestLoading =
    employees.status === "loading" || certifications.status === "loading";
  const requestError =
    employees.status === "error" || certifications.status === "error";

  return (
    <>
      {requestError ?
        <div className="text-center">
          <div className="mb-4">Unable to download data</div>
          <div>
            <button
              className="rounded bg-blue text-gray-200 w-1/4 max-w-20"
              onClick={reload}
            >
              Reload
            </button>
          </div>
        </div>
      : requestLoading ?
        <div>Loading...</div>
      : complete === CompleteState.SIGN_IN_ERROR && badge !== null ?
        <SignInError
          name={name}
          loading={loading}
          onTryAgain={() => {
            submit(
              badge,
              radio,
              getExpired(certifications.result, now),
              setComplete,
              setLoading,
              onComplete,
            );
          }}
        />
      : complete === CompleteState.BADGE_SERIAL_LOOKUP_ERROR ?
        <BadgeSerialLookupError />
      : complete === CompleteState.NFC_SCAN_ERROR ?
        <NfcScanError />
      : complete === CompleteState.SUCCESS && badge !== null ?
        <Success name={name} />
      : badge === null ?
        <OperatorSelection
          nfcSupported={nfcSupported()}
          onOK={setBadge}
          onBadgeLookupError={() => {
            setComplete(CompleteState.BADGE_SERIAL_LOOKUP_ERROR);
          }}
          onNfcScanError={() => {
            setComplete(CompleteState.NFC_SCAN_ERROR);
          }}
        />
      : <Attestation
          prefill={badge.method === "nfc"}
          badge={badge.number}
          loading={loading}
          onComplete={(radio: string) => {
            setRadio(radio);
            submit(
              badge,
              radio,
              getExpired(certifications.result, now),
              setComplete,
              setLoading,
              onComplete,
            );
          }}
          employees={employees.result}
          certifications={certifications.result}
        />
      }
    </>
  );
};
