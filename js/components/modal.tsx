import { Modal as RestartModal } from "@restart/ui";
import { ReactElement } from "react";

export const Modal = ({
  children,
  title,
  show,
  onClose,
}: {
  children: ReactElement;
  title: ReactElement;
  show: boolean;
  onClose: () => void;
}): ReactElement => {
  return (
    <RestartModal
      show={show}
      onHide={onClose}
      className="w-11/12 md:w-2/3 fixed z-modal-content flex max-h-[calc(100vh-3.5rem)] flex-col bg-gray-200 border-2 border-black p-6 -translate-x-2/4 -translate-y-2/4 top-2/4 left-2/4"
      renderBackdrop={(props) => (
        <div
          {...props}
          className="fixed inset-0 z-modal-backdrop w-full h-full bg-black/[0.48]"
        />
      )}
    >
      <div className='grid grid-cols-[1fr_max-content] grid-rows-[max-content_1fr] [grid-template-areas:"title_close"_"contents_contents"] overflow-scroll'>
        <div className="[grid-area:title]">{title}</div>
        <button className="[grid-area:close]" onClick={onClose}>
          <img
            src="/images/close.svg"
            alt="Close"
            className="w-4 hover:opacity-50"
          />
        </button>
        <div className="[grid-area:contents]">{children}</div>
      </div>
    </RestartModal>
  );
};
