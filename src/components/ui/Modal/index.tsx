"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";

type Props = {
  open: boolean;
  title?: string;
  children: React.ReactNode;
  onClose: () => void;
  panelClassName?: string;
};

export function Modal({
  open,
  title,
  children,
  onClose,
  panelClassName = "w-full max-w-md rounded-2xl bg-white p-6 shadow-xl",
}: Props) {
  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        onClose();
      }
    }

    const scrollBarWidth =
      window.innerWidth - document.documentElement.clientWidth;

    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    if (scrollBarWidth > 0) {
      document.body.style.paddingRight = `${scrollBarWidth}px`;
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "modal-title" : undefined}
    >
      <div
        className={panelClassName}
        onClick={(event) => event.stopPropagation()}
      >
        {title ? (
          <h2 id="modal-title" className="mb-3 text-xl font-semibold">
            {title}
          </h2>
        ) : null}

        {children}
      </div>
    </div>,
    document.body,
  );
}