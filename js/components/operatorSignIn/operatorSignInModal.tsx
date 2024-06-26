import { Modal } from "../modal";
import { OperatorSelection } from "./operatorSelection";
import { ReactElement, useState } from "react";

export const OperatorSignInModal = (): ReactElement => {
  const [show, setShow] = useState<boolean>(true);

  return (
    <Modal
      show={show}
      title={<span className="text-lg font-bold">Fit for Duty Check</span>}
      onClose={() => {
        setShow(false);
      }}
    >
      <OperatorSelection nfcSupported={true} />
    </Modal>
  );
};
