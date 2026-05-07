import React from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { FieldGroupDef } from "../core/schema";

interface FieldGroupProps {
  group: FieldGroupDef;
  collapsed: boolean;
  fieldCount: number;
  filledCount: number;
  requiredCount: number;
  requiredFilled: number;
  onToggle: () => void;
  children: React.ReactNode;
}

export const FieldGroup: React.FC<FieldGroupProps> = ({
  group,
  collapsed,
  fieldCount,
  filledCount,
  requiredCount,
  requiredFilled,
  onToggle,
  children
}) => {
  const sectionId = `field-group-${group.id}`;
  const requiredComplete = requiredCount > 0 && requiredFilled === requiredCount;

  return (
    <section className="mb-6 last:mb-0" aria-labelledby={`${sectionId}-heading`}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={!collapsed}
        aria-controls={sectionId}
        className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-md bg-gray-50 dark:bg-[#262626] border border-gray-200 dark:border-[#333] hover:bg-gray-100 dark:hover:bg-[#2C2C2C] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
      >
        <div className="flex items-center gap-2 min-w-0">
          {collapsed ? (
            <ChevronRight size={16} className="text-gray-500 dark:text-gray-400 shrink-0" />
          ) : (
            <ChevronDown size={16} className="text-gray-500 dark:text-gray-400 shrink-0" />
          )}
          <h3
            id={`${sectionId}-heading`}
            className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate"
          >
            {group.label}
          </h3>
          <span className="text-xs text-gray-500 dark:text-gray-400 hidden sm:inline truncate">
            {group.description}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0 text-xs font-mono">
          {requiredCount > 0 && (
            <span
              className={`rounded px-1.5 py-0.5 ${
                requiredComplete
                  ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                  : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
              }`}
              aria-label={`${requiredFilled} of ${requiredCount} required filled`}
            >
              {requiredFilled}/{requiredCount} req
            </span>
          )}
          <span className="text-gray-500 dark:text-gray-400">
            {filledCount}/{fieldCount}
          </span>
        </div>
      </button>
      {!collapsed && (
        <div
          id={sectionId}
          className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 lg:gap-8 px-1"
        >
          {children}
        </div>
      )}
    </section>
  );
};
