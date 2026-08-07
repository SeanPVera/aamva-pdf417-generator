import React, { createContext, useCallback, useContext, useRef, useState } from "react";
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from "lucide-react";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastOptions {
  /** When true the toast stays until the user dismisses it. */
  persistent?: boolean;
  /**
   * An inline button, used to make a destructive action recoverable without a
   * blocking confirm dialog — clear, apply a preset, import over a filled form.
   * Clicking it runs the handler and dismisses the toast.
   */
  action?: ToastAction;
  /** Override the auto-dismiss delay. Ignored when `persistent` is set. */
  durationMs?: number;
}

interface Toast {
  id: number;
  message: string;
  type: ToastType;
  persistent: boolean;
  action?: ToastAction;
}

interface ToastContextValue {
  show: (message: string, type?: ToastType, options?: ToastOptions) => void;
  success: (message: string, options?: ToastOptions) => void;
  error: (message: string, options?: ToastOptions) => void;
  info: (message: string, options?: ToastOptions) => void;
  warning: (message: string, options?: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

// eslint-disable-next-line react-refresh/only-export-components
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}

const ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 size={16} className="text-green-500" />,
  error: <XCircle size={16} className="text-red-500" />,
  info: <Info size={16} className="text-blue-500" />,
  warning: <AlertTriangle size={16} className="text-amber-500" />
};

const COLORS: Record<ToastType, string> = {
  success:
    "bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200",
  error:
    "bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200",
  info: "bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200",
  warning:
    "bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200"
};

const DURATION_MS = 3000;
/** Toasts carrying an action stay long enough to actually click it. */
const ACTION_DURATION_MS = 8000;

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (message: string, type: ToastType = "info", options?: ToastOptions) => {
      idRef.current += 1;
      const id = idRef.current;
      const persistent = !!options?.persistent;
      setToasts((list) => [...list, { id, message, type, persistent, action: options?.action }]);
      if (!persistent) {
        // An undo affordance needs longer than a status message to be usable.
        const duration =
          options?.durationMs ?? (options?.action ? ACTION_DURATION_MS : DURATION_MS);
        window.setTimeout(() => dismiss(id), duration);
      }
    },
    [dismiss]
  );

  const value: ToastContextValue = {
    show,
    success: (m, opts) => show(m, "success", opts),
    error: (m, opts) => show(m, "error", opts),
    info: (m, opts) => show(m, "info", opts),
    warning: (m, opts) => show(m, "warning", opts)
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none"
        role="region"
        aria-label="Notifications"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.type === "error" ? "alert" : "status"}
            className={`pointer-events-auto flex items-start gap-2 min-w-[240px] max-w-sm px-3 py-2 rounded-md border shadow-md text-sm animate-toast-in ${COLORS[t.type]}`}
          >
            <span className="mt-0.5 shrink-0">{ICONS[t.type]}</span>
            <span className="flex-1 break-words">{t.message}</span>
            {t.action && (
              <button
                type="button"
                onClick={() => {
                  t.action?.onClick();
                  dismiss(t.id);
                }}
                className="shrink-0 self-start px-2 py-0.5 rounded border border-current/30 text-xs font-semibold uppercase tracking-wide hover:bg-black/5 dark:hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              >
                {t.action.label}
              </button>
            )}
            <button
              type="button"
              aria-label="Dismiss notification"
              onClick={() => dismiss(t.id)}
              className="shrink-0 opacity-60 hover:opacity-100 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
