import { ReactNode, useId } from "react";
import type { MouseEvent } from "react";

type ModalProps = {
  isOpen: boolean;
  title: string;
  eyebrow?: string;
  onClose?: () => void;
  children: ReactNode;
};

export const Modal = ({ isOpen, title, eyebrow, onClose, children }: ModalProps) => {
  const titleId = useId();

  if (!isOpen) {
    return null;
  }

  const handleBackdropClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose?.();
    }
  };

  return (
    <div
      className="modal-backdrop debug"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={handleBackdropClick}
    >
      <div className="modal-card">
        <div className="modal-header">
          <div>
            {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
            <h3 id={titleId}>{title}</h3>
          </div>
          {onClose ? (
            <button className="link button-link" onClick={onClose}>
              Fechar
            </button>
          ) : null}
        </div>
        {children}
      </div>
    </div>
  );
};
