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
      className="fixed inset-0 z-10 flex items-end justify-center bg-black/50 p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={handleBackdropClick}
    >
      <div className="w-full max-h-[90vh] overflow-y-auto rounded-modal border border-border bg-bg-strong p-6 shadow-card">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            {eyebrow ? (
              <p className="text-[0.62rem] font-semibold uppercase tracking-[0.28em] text-muted">
                {eyebrow}
              </p>
            ) : null}
            <h3 id={titleId} className="text-[1.1rem] font-title">
              {title}
            </h3>
          </div>
          {onClose ? (
            <button
              className="text-sm font-semibold text-text transition hover:opacity-80"
              onClick={onClose}
            >
              Fechar
            </button>
          ) : null}
        </div>
        {children}
      </div>
    </div>
  );
};
