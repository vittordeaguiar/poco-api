import { ReactNode, useId } from "react";
import type { MouseEvent } from "react";
import { X } from "lucide-react";

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
      className="fixed inset-0 z-10 flex items-center justify-center bg-[rgba(30,26,22,0.55)] p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={handleBackdropClick}
    >
      <div className="flex max-h-[85vh] w-full max-w-[640px] flex-col overflow-hidden rounded-modal surface-panel">
        <div className="flex items-center justify-between gap-4 px-5 pb-4 pt-6 sm:px-6">
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
              className="inline-flex items-center gap-2 text-sm font-semibold text-text transition hover:opacity-80"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
              <span className="hidden sm:inline">Fechar</span>
            </button>
          ) : null}
        </div>
        <div className="flex-1 overflow-y-auto px-5 pb-6 sm:px-6">{children}</div>
        {footer || onClose ? (
          <div className="border-t border-border bg-bg-strong px-5 py-4 sm:px-6">
            <div className="flex flex-wrap items-center justify-end gap-3">
              {onClose ? (
                <button
                  className="inline-flex items-center gap-2 rounded-pill border border-border bg-bg-strong px-4 py-2 text-sm font-semibold text-text"
                  type="button"
                  onClick={onClose}
                >
                  <X className="h-4 w-4" />
                  <span className="hidden sm:inline">Cancelar</span>
                </button>
              ) : null}
              {footer}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
