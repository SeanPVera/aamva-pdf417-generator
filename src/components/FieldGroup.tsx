import React from "react";
import type { FieldGroupDef } from "../core/schema";

/**
 * The field grid, shared by both views so they cannot drift apart.
 *
 * Three columns is the ceiling now rather than four. At 56px controls with the
 * label above and the advisory in flow, a fourth column produced ~180px of
 * usable width per field — narrow enough to put the truncation back that
 * moving the label out of the input had just removed.
 *
 * The gap dropped from `gap-6 lg:gap-8` because the row beneath each input is
 * no longer absolutely positioned at `-bottom-4`; the grid had been carrying
 * space for content that was overflowing its own cell.
 */
export const FIELD_GRID_CLASS = "grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-x-6 gap-y-5";

interface FieldGroupProps {
  group: FieldGroupDef;
  fieldCount: number;
  filledCount: number;
  requiredCount: number;
  requiredFilled: number;
  children: React.ReactNode;
}

/**
 * A labelled band of fields. Used only by the filtered view, where matches from
 * several sections are shown at once and each run needs saying which section it
 * came from. The unfiltered view shows one section at a time, and there the
 * section heading is the page heading — a second one inside it would just be
 * the same words twice.
 *
 * The accordion is gone with the collapse controls. Nothing collapses now: in
 * the filtered view every match is on screen by definition, and hiding a run of
 * search results behind a chevron is the opposite of what a search is for.
 */
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
    <section className="mb-8 last:mb-0" aria-labelledby={`${sectionId}-heading`}>
      <div className="mb-4 flex items-baseline justify-between gap-3 border-b border-gray-200 pb-2 dark:border-[#333]">
        <div className="flex min-w-0 items-baseline gap-2.5">
          <h3
            id={`${sectionId}-heading`}
            className="text-k-label font-bold text-gray-900 dark:text-gray-50"
          >
            {group.label}
          </h3>
          <span className="hidden truncate text-k-help text-gray-600 sm:inline dark:text-gray-400">
            {group.description}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-2 font-mono text-k-help">
          {requiredCount > 0 && (
            <span
              className={`rounded px-1.5 py-0.5 ${
                requiredComplete
                  ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
                  : "bg-gray-100 text-gray-700 dark:bg-dark-surface2 dark:text-gray-300"
              }`}
              aria-label={`${requiredFilled} of ${requiredCount} required filled`}
            >
              {requiredFilled}/{requiredCount} req
            </span>
          )}
          <span className="text-gray-600 dark:text-gray-400">
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
