import { useEmployees } from "../../hooks/useEmployees";
import { nfcSupported } from "../../util/nfc";
import { Modal } from "../modal";
import { Attestation } from "./attestation";
import { OperatorSelection } from "./operatorSelection";
import { ReactElement, useState } from "react";

export const OperatorSignInModal = (): ReactElement => {
  const [show, setShow] = useState<boolean>(true);
  const [badge, setBadge] = useState<string | null>(null);

  const employees = useEmployees();

  return (
    <Modal
      show={show}
      title={<span className="text-lg font-bold">Fit for Duty Check</span>}
      onClose={() => {
        setShow(false);
      }}
    >
      {badge === null ?
        <OperatorSelection nfcSupported={nfcSupported()} onOK={setBadge} />
      : <Attestation
          badge={badge}
          onComplete={() => {
            alert("Clicked!");
          }}
          employees={employees}
        />
      }
    </Modal>
  );
};
