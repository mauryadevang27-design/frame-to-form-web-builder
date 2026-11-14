import { useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "./Spinner";

interface ConfirmationModalProps {
  open: boolean;
  icon?: ReactNode | undefined;
  title: string;
  description?: ReactNode | undefined;
  confirmLabel?: string | undefined;
  cancelLabel?: string | undefined;
  tone?: "danger" | "primary" | undefined;
  onConfirm?: (() => void | Promise<void>) | undefined;
  onClose: () => void;
  children?: ReactNode | undefined;
}

/** Modal scoped to the popup frame (absolute, not portalled to the page). */
export function ConfirmationModal({
  open,
  icon,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "danger",
  onConfirm,
  onClose,
  children,
}: ConfirmationModalProps) {
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setBusy(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const confirm = async () => {
    if (!onConfirm) return onClose();
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="absolute inset-0 z-40 flex items-end justify-center p-3 sm:items-center">
      <div
        className="absolute inset-0 bg-stage/70 backdrop-blur-[2px] animate-fade-soft"
        onClick={() => !busy && onClose()}
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="tt-modal-title"
        className="relative w-full rounded-2xl border border-border-strong bg-popover p-4 shadow-popup animate-pop-in"
      >
        {icon && (
          <div
            className={`mb-3 flex size-9 items-center justify-center rounded-xl [&_svg]:size-4 ${tone === "danger" ? "bg-destructive/12 text-destructive" : "bg-primary/12 text-primary"}`}
          >
            {icon}
          </div>
        )}
        <h3
          id="tt-modal-title"
          className="text-[15px] font-semibold tracking-tight text-foreground"
        >
          {title}
        </h3>
        {description && (
          <p className="mt-1 text-[12.5px] leading-5 text-muted-foreground">{description}</p>
        )}
        {children && <div className="mt-3">{children}</div>}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button variant="surface" className="h-9 rounded-xl" onClick={onClose} disabled={busy}>
            {cancelLabel}
          </Button>
          <Button
            variant={tone === "danger" ? "danger" : "primary"}
            className="h-9 rounded-xl"
            onClick={confirm}
            disabled={busy}
          >
            {busy && <Spinner />}
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
