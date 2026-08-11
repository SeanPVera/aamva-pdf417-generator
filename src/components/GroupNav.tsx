import React from "react";
import { AlertCircle, Check } from "lucide-react";
import type { FieldGroupId } from "../core/schema";

export interface GroupNavStat {
  id: FieldGroupId;
  label: string;
  /** Fields from this group currently visible under the active filters. */
  total: number;
  /** How many of this group's required fields still have no value. */
  emptyRequired: number;
  /** Validation errors sitting in this group. */
  errors: number;
  /** True once every required field in the group has a value. */
  complete: boolean;
}

interface GroupNavProps {
  stats: GroupNavStat[];
  onJump: (id: FieldGroupId) => void;
}

/**
 * A one-line map of the form.
 *
 * A v10 schema is thirty-odd fields across five collapsible groups, and the
 * only way to find out that the two errors are down in Driving Privileges was
 * to scroll there. This puts each group's state on screen at all times — errors
 * first, then what is still empty — and makes the label a jump target.
 */
export const GroupNav: React.FC<GroupNavProps> = ({ stats, onJump }) => {
  const visible = stats.filter((s) => s.total > 0);
  if (visible.length < 2) return null;

  return (
    <nav className="flex flex-wrap items-center gap-1.5 pt-0.5" aria-label="Jump to a field group">
      {visible.map((group) => {
        const tone =
          group.errors > 0
            ? "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/25 text-red-700 dark:text-red-300"
            : group.complete
              ? "border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/25 text-green-700 dark:text-green-300"
              : "border-gray-200 dark:border-[#444] bg-gray-50 dark:bg-dark-surface2 text-gray-600 dark:text-gray-300";
        const status =
          group.errors > 0
            ? `${group.errors} error${group.errors === 1 ? "" : "s"}`
            : group.emptyRequired > 0
              ? `${group.emptyRequired} required field${group.emptyRequired === 1 ? "" : "s"} empty`
              : "complete";

        return (
          <button
            key={group.id}
            type="button"
            onClick={() => onJump(group.id)}
            title={`${group.label} — ${status}`}
            aria-label={`Jump to ${group.label}: ${status}`}
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium transition-colors hover:brightness-95 dark:hover:brightness-125 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${tone}`}
          >
            {group.errors > 0 ? (
              <AlertCircle size={11} aria-hidden />
            ) : group.complete ? (
              <Check size={11} aria-hidden />
            ) : null}
            {group.label}
            {group.errors > 0 ? (
              <span className="font-mono font-semibold">{group.errors}</span>
            ) : group.emptyRequired > 0 ? (
              <span className="font-mono opacity-70">{group.emptyRequired}</span>
            ) : null}
          </button>
        );
      })}
    </nav>
  );
};
