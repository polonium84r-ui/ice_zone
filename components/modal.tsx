"use client";

/**
 * Modal — port of the original .modal-overlay / .modal markup and behavior
 * (click outside or × to close, body scroll locked while open).
 */
import { useEffect, type ReactNode } from "react";

export function Modal({
  open,
  onClose,
  title,
  children,
  large = false,
  className = "",
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  large?: boolean;
  className?: string;
}) {
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div
      className={`modal-overlay ${open ? "open" : ""}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={`modal ${large ? "modal-lg" : ""} ${className}`.trim()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="modal-close" aria-label="Close" onClick={onClose}>
            &times;
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
