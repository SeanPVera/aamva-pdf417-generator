import React from "react";
import { X } from "lucide-react";
import { useModalShell } from "../hooks/useModalShell";

export const InspectorModal: React.FC<{ onClose: () => void; children: React.ReactNode }> = ({
  onClose,
  children
}) => {
  const dialogRef = useModalShell<HTMLDivElement>({ open: true, onClose });
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="inspector-title"
        className="w-full max-w-4xl bg-white dark:bg-dark-surface rounded-lg shadow-xl border border-gray-200 dark:border-dark-border max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-dark-border">
          <h2
            id="inspector-title"
            className="text-base font-semibold text-gray-800 dark:text-gray-100"
          >
            Payload Inspector
          </h2>
          <button
            data-autofocus
            type="button"
            onClick={onClose}
            aria-label="Close inspector"
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-dark-surface2 text-gray-600 dark:text-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            <X size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-auto p-4 space-y-4">{children}</div>
      </div>
    </div>
  );
};
