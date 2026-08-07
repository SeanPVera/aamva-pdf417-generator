import React from "react";
import { X, Award } from "lucide-react";
import { BADGES, earnedBadges, featuredBadge, type BadgeStats } from "../core/badges";
import { useModalShell } from "../hooks/useModalShell";

interface EmployeeOfTheMonthProps {
  open: boolean;
  onClose: () => void;
  stats: BadgeStats;
}

/**
 * A framed plaque awarding badges for things the app already observes. Every
 * criterion reads a counter — never a field value — so the board can be shown
 * to anyone without leaking what was typed.
 */
export const EmployeeOfTheMonth: React.FC<EmployeeOfTheMonthProps> = ({ open, onClose, stats }) => {
  const dialogRef = useModalShell<HTMLDivElement>({ open, onClose });
  if (!open) return null;

  const earned = earnedBadges(stats);
  const featured = featuredBadge(stats);
  const earnedIds = new Set(earned.map((b) => b.id));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="eotm-title"
        className="w-full max-w-lg bg-white dark:bg-dark-surface rounded-lg shadow-xl border border-gray-200 dark:border-dark-border max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-dark-border">
          <h2
            id="eotm-title"
            className="flex items-center gap-2 text-base font-semibold text-gray-800 dark:text-gray-100"
          >
            <Award size={16} />
            Employee of the Month
          </h2>
          <button
            data-autofocus
            type="button"
            onClick={onClose}
            aria-label="Close the plaque"
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-dark-surface2 text-gray-600 dark:text-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="plaque">
            <div className="plaque-frame">
              <div className="plaque-photo">{featured ? featured.emoji : "🧑‍💼"}</div>
              <div className="plaque-plate">
                <div className="plaque-plate-title">
                  {featured ? featured.label : "Position Vacant"}
                </div>
                <div className="plaque-plate-sub">
                  {featured
                    ? featured.blurb
                    : "Gus is holding the spot. He is very pleased about it."}
                </div>
              </div>
            </div>
          </div>

          <ul className="space-y-1.5">
            {BADGES.map((badge) => {
              const isEarned = earnedIds.has(badge.id);
              const progress = badge.progress?.(stats);
              return (
                <li
                  key={badge.id}
                  className={`flex items-start gap-3 rounded-md border px-3 py-2 ${
                    isEarned
                      ? "border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20"
                      : "border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-surface2 opacity-70"
                  }`}
                >
                  <span
                    className={`text-lg leading-none mt-0.5 ${isEarned ? "" : "grayscale opacity-50"}`}
                    aria-hidden
                  >
                    {badge.emoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-gray-800 dark:text-gray-100">
                      {badge.label}
                      {isEarned && (
                        <span className="ml-2 text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">
                          Earned
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{badge.blurb}</div>
                  </div>
                  {progress && (
                    <span className="text-xs font-mono text-gray-500 dark:text-gray-400 shrink-0">
                      {progress}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>

          <p className="text-[11px] text-gray-400 dark:text-gray-500">
            Counted from actions only — jurisdictions visited, barcodes generated, undos pressed. No
            field value is ever read, stored, or shown here.
          </p>
        </div>
      </div>
    </div>
  );
};
