import { ReactNode, useId } from "react";
import type { MouseEvent } from "react";

type ModalProps = {
  isOpen: boolean;
  title: string;
  eyebrow?: string;
  onClose?: () => void;
  children: ReactNode;
  footer?: ReactNode;
};

export const Modal = ({
  isOpen,
  title,
  eyebrow,
  onClose,
  children,
  footer,
}: ModalProps) => {
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
      className="fixed inset-0 z-10 flex items-center justify-center bg-black/50 p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={handleBackdropClick}
    >
      <div className="flex max-h-[70vh] w-1/2 flex-col overflow-hidden rounded-modal border border-border bg-bg-strong shadow-card">
        <div className="flex items-center justify-between gap-4 px-6 pb-4 pt-6">
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
        <div className="flex-1 overflow-y-auto px-6 pb-6">{children}</div>
        {footer ? (
          <div className="border-t border-border bg-bg-strong px-6 py-4">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
};
