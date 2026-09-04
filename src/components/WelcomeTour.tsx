import React from "react";
import { X, ChevronRight, ChevronLeft, Sparkles, Search, Camera, ScanBarcode } from "lucide-react";
import { useModalShell } from "../hooks/useModalShell";

interface WelcomeTourProps {
  open: boolean;
  onClose: () => void;
}

interface Step {
  title: string;
  body: React.ReactNode;
  icon: React.ReactNode;
}

const STEPS: Step[] = [
  {
    title: "Pick a state and version",
    icon: <Sparkles size={18} />,
    body: (
      <>
        Use the <strong>Setup</strong> panel to pick a jurisdiction and AAMVA version. On a phone
        that lives in the bottom tab; on a desk it is the left column. The form rebuilds itself
        for that combination, including any state-specific exclusions.
      </>
    )
  },
  {
    title: "Fill the fields, grouped by purpose",
    icon: <Search size={18} />,
    body: (
      <>
        One section at a time, behind the <strong>step rail</strong>. Identity, Address, License
        Details — work a rung, then the next. Search with{" "}
        <kbd className="px-1 py-0.5 rounded border bg-gray-100 dark:bg-gray-700 text-[11px] font-mono">
          Ctrl+K
        </kbd>{" "}
        to bring every match back onto one screen.
      </>
    )
  },
  {
    title: "Generate auto fields and preview",
    icon: <ScanBarcode size={18} />,
    body: (
      <>
        Click <strong>Generate auto fields</strong> (or press{" "}
        <kbd className="px-1 py-0.5 rounded border bg-gray-100 dark:bg-gray-700 text-[11px] font-mono">
          Ctrl+G
        </kbd>
        ) to fill DCF, DAQ, and DDB. The barcode preview updates live and you can copy the payload
        with{" "}
        <kbd className="px-1 py-0.5 rounded border bg-gray-100 dark:bg-gray-700 text-[11px] font-mono">
          Ctrl+Shift+C
        </kbd>
        .
      </>
    )
  },
  {
    title: "Scan, import, or export",
    icon: <Camera size={18} />,
    body: (
      <>
        Scan an existing card with the <strong>Scan ID</strong> button, or drag a JSON profile
        anywhere on the page to import. Export a single barcode as PNG/SVG, or use{" "}
        <strong>Batch Processing</strong> to generate many at once.
      </>
    )
  }
];

export const WelcomeTour: React.FC<WelcomeTourProps> = ({ open, onClose }) => {
  if (!open) return null;
  return <WelcomeTourBody onClose={onClose} />;
};

const WelcomeTourBody: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [step, setStep] = React.useState(0);
  // Focus trap, focus restore, and Escape all come from the shared shell.
  const dialogRef = useModalShell<HTMLDivElement>({ open: true, onClose });

  // Arrow-key step navigation is specific to the tour.
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        setStep((s) => Math.min(STEPS.length - 1, s + 1));
      } else if (e.key === "ArrowLeft") {
        setStep((s) => Math.max(0, s - 1));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const current = STEPS[step] ?? STEPS[0]!;
  const isLast = step === STEPS.length - 1;

  return (
    <div
      className="fixed inset-0 z-[55] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="welcome-tour-title"
        className="w-full max-w-md bg-white dark:bg-dark-surface rounded-lg shadow-xl border border-gray-200 dark:border-dark-border overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-dark-border">
          <h2
            id="welcome-tour-title"
            className="flex items-center gap-2 text-base font-semibold text-gray-800 dark:text-gray-100"
          >
            <span className="text-brand-600 dark:text-brand-400">{current.icon}</span>
            {current.title}
          </h2>
          <button
            data-autofocus
            type="button"
            onClick={onClose}
            aria-label="Skip tour"
            className="inline-flex h-k-touch w-k-touch items-center justify-center rounded-k text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-dark-surface2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-5 text-sm text-gray-700 dark:text-gray-200 leading-relaxed min-h-[110px]">
          {current.body}
        </div>

        <div className="px-4 pb-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5" role="group" aria-label="Tour progress">
            {STEPS.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === step ? "w-6 bg-brand-500" : "w-1.5 bg-gray-300 dark:bg-gray-600"
                }`}
                aria-current={i === step}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              aria-label="Previous step"
              className="inline-flex h-k-touch items-center gap-1 rounded-k px-3 text-k-label text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-gray-200 dark:hover:bg-dark-surface2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              <ChevronLeft size={14} />
              Back
            </button>
            {isLast ? (
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-k-touch items-center gap-1 rounded-k bg-brand-600 px-4 text-k-label font-semibold text-white hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              >
                Get started
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
                className="inline-flex h-k-touch items-center gap-1 rounded-k bg-brand-600 px-4 text-k-label font-semibold text-white hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              >
                Next
                <ChevronRight size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
