import React from "react";
import type { FieldGroupDef } from "../core/schema";

/**
 * Ledger field list class. Desktop Technical Inspector renders fields as
 * code | label | value rows; mobile stacks via CSS.
 */
export const FIELD_GRID_CLASS = "field-grid";

interface FieldGroupProps {
  group: FieldGroupDef;
  fieldCount: number;
  filledCount: number;
  requiredCount: number;
  requiredFilled: number;
  children: React.ReactNode;
}

export const FieldGroup: React.FC<FieldGroupProps> = ({
  group,
  fieldCount,
  filledCount,
  requiredCount,
  requiredFilled,
  children
}) => {
  const sectionId = `field-group-${group.id}`;
  const requiredComplete = requiredCount > 0 && requiredFilled === requiredCount;

  return (
    <section className="mb-6 last:mb-0" aria-labelledby={`${sectionId}-heading`}>
      <div className="mb-2 flex items-baseline justify-between gap-3 border-b border-[var(--rule)] pb-2">
        <div className="flex min-w-0 items-baseline gap-2.5">
          <h3
            id={`${sectionId}-heading`}
            className="font-mono text-k-label font-semibold text-[var(--ink)]"
          >
            @{group.label}
          </h3>
          <span className="hidden truncate text-k-help text-[var(--muted)] sm:inline">
            {group.description}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-2 font-mono text-k-help">
          {requiredCount > 0 && (
            <span
              className={`ledger-badge ${requiredComplete ? "ok" : ""}`}
              aria-label={`${requiredFilled} of ${requiredCount} required filled`}
            >
              {requiredFilled}/{requiredCount} req
            </span>
          )}
          <span className="text-[var(--muted)]">
            {filledCount}/{fieldCount}
          </span>
        </div>
      </div>
      <div id={sectionId} className={FIELD_GRID_CLASS}>
        {children}
      </div>
    </section>
  );
};
