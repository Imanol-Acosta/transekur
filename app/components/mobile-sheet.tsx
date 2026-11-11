"use client";

import { useId, useLayoutEffect, useRef, type ReactNode } from "react";
import { Icon } from "./icons";

export function MobileSheet({ open, onClose, title, closeLabel = "Close", children }: {
  open: boolean;
  onClose: () => void;
  title: string;
  closeLabel?: string;
  children: ReactNode;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (!open || !dialog) return;

    dialog.showModal();
    const viewport = window.visualViewport;
    function fitViewport() {
      if (!dialog || !viewport || viewport.scale !== 1) return;
      const keyboardInset = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop);
      dialog.style.setProperty("--sheet-viewport", `${viewport.height}px`);
      dialog.style.setProperty("--sheet-keyboard-inset", `${keyboardInset}px`);
    }
    fitViewport();
    viewport?.addEventListener("resize", fitViewport);
    viewport?.addEventListener("scroll", fitViewport);
    return () => {
      viewport?.removeEventListener("resize", fitViewport);
      viewport?.removeEventListener("scroll", fitViewport);
      dialog.close();
    };
  }, [open]);

  return (
    <dialog className="mobile-sheet" ref={dialogRef} aria-labelledby={titleId} onCancel={(event) => {
      event.preventDefault();
      onClose();
    }}>
      <header className="mobile-sheet-header">
        <h2 id={titleId}>{title}</h2>
        <button className="mobile-icon-button" type="button" aria-label={closeLabel} onClick={onClose}><Icon name="close" /></button>
      </header>
      {open && <div className="mobile-sheet-content">{children}</div>}
    </dialog>
  );
}
