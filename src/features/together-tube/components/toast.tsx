import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastTone = "success" | "info" | "warning" | "error";

interface ToastItem {
  id: number;
  title: string;
  description?: string | undefined;
  tone: ToastTone;
}

interface ToastApi {
  show: (toast: { title: string; description?: string | undefined; tone?: ToastTone }) => void;
}

interface ToastStore extends ToastApi {
  toasts: ToastItem[];
  dismiss: (id: number) => void;
  clear: () => void;
}

const ToastContext = createContext<ToastStore | null>(null);

export function useToast(): ToastStore {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

const toneIcon = {
  success: <CheckCircle2 className="size-4 text-success" />,
  info: <Info className="size-4 text-primary" />,
  warning: <AlertTriangle className="size-4 text-warning" />,
  error: <AlertTriangle className="size-4 text-destructive" />,
} satisfies Record<ToastTone, ReactNode>;

/** Holds toast state; render <ToastViewport /> where toasts should appear. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const show = useCallback<ToastApi["show"]>(
    ({ title, description, tone = "success" }) => {
      const id = nextId.current++;
      setToasts((list) => [...list.slice(-2), { id, title, description, tone }]);
      setTimeout(() => dismiss(id), 2800);
    },
    [dismiss],
  );

  const clear = useCallback(() => setToasts([]), []);
  const store = useMemo(() => ({ show, toasts, dismiss, clear }), [show, toasts, dismiss, clear]);

  return <ToastContext.Provider value={store}>{children}</ToastContext.Provider>;
}

/** Place inside the popup frame; toasts stack at its bottom edge. */
export function ToastViewport() {
  const ctx = useContext(ToastContext);
  if (!ctx) return null;
  const { toasts, dismiss: onDismiss } = ctx;
  return (
    <div
      aria-live="polite"
      className="pointer-events-none absolute inset-x-3 bottom-3 z-50 flex flex-col items-stretch gap-2"
    >
      {toasts.map((t) => (
        <ToastNotification key={t.id} toast={t} onDismiss={() => onDismiss(t.id)} />
      ))}
    </div>
  );
}

export function ToastNotification({
  toast,
  onDismiss,
}: {
  toast: ToastItem;
  onDismiss: () => void;
}) {
  return (
    <div
      role="status"
      className={cn(
        "pointer-events-auto flex items-start gap-2.5 rounded-xl border border-border-strong bg-popover/95 px-3 py-2.5 shadow-popup backdrop-blur-md animate-toast-in",
      )}
    >
      <span className="mt-0.5">{toneIcon[toast.tone]}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-medium leading-5 text-foreground">{toast.title}</p>
        {toast.description && (
          <p className="text-xs leading-4 text-muted-foreground">{toast.description}</p>
        )}
      </div>
      <button
        onClick={onDismiss}
        aria-label="Dismiss"
        className="rounded-md p-0.5 text-subtle-foreground transition-colors hover:text-foreground"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}
