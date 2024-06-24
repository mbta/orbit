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
      className="fixed z-modal-content flex max-h-[calc(100vh-3.5rem)] flex-col bg-gray-100 border-2 border-black p-1 -translate-x-2/4 -translate-y-2/4 top-2/4 left-2/4"
      renderBackdrop={(props) => (
        <div
          {...props}
          className="fixed inset-0 z-modal-backdrop w-full h-full bg-black/[0.48]"
        />
      )}
    >
      <div className='grid grid-cols-[1fr_max-content] grid-rows-[max-content_1fr] [grid-template-areas:"title_close"_"contents_contents"]'>
        <div className="[grid-area:title]">{title}</div>
        <button className="[grid-area:close]" onClick={onClose}>
          [x]
        </button>
        <div className="[grid-area:contents]">{children}</div>
      </div>
    </RestartModal>
  );
};
