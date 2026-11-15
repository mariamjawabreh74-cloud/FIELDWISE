import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";

export function Modal({
  open,
  onClose,
  title,
  children,
  drawer = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  drawer?: boolean;
}) {
  const { t } = useTranslation();
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  useEffect(() => {
    if (!open || !dialog.current) return;
    const previous = document.activeElement as HTMLElement | null;
    const element = dialog.current;
    if (typeof element.showModal === "function") element.showModal();
    else element.setAttribute("open", "");
    const handleCancel = (event: Event) => {
      event.preventDefault();
      onCloseRef.current();
    };
    element.addEventListener("cancel", handleCancel);
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      element.removeEventListener("cancel", handleCancel);
      if (element.open && typeof element.close === "function") element.close();
      document.body.style.overflow = oldOverflow;
      previous?.focus();
    };
  }, [open]);
  if (!open) return null;
  return createPortal(
    <dialog
      ref={dialog}
      className={`app-dialog ${drawer ? "evidence-dialog" : ""}`}
      aria-labelledby={titleId}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="dialog-content">
        <header className="dialog-header">
          <h2 id={titleId}>{title}</h2>
          <button
            autoFocus
            className="icon-button"
            onClick={onClose}
            aria-label={t("common.close")}
          >
            <X size={22} />
          </button>
        </header>
        {children}
      </div>
    </dialog>,
    document.body,
  );
}
