import React from "react";
import { Check, AlertCircle, CircleAlert } from "lucide-react";
import type { FieldGroupId } from "../core/schema";

export interface StepRailSection {
  id: FieldGroupId;
  label: string;
  /** Fields this jurisdiction and version actually put in the section. */
  total: number;
  requiredTotal: number;
  requiredFilled: number;
  /**
   * Values the validator rejects. Blank required fields are deliberately NOT
   * counted here — those are `requiredTotal - requiredFilled`, which is work
   * remaining rather than a mistake. Conflating the two is what made a
   * pristine form open in red.
   */
  errors: number;
  /** Jurisdiction recommendations and soft cross-field checks. */
  advisories: number;
}

interface StepRailProps {
  sections: StepRailSection[];
  active: FieldGroupId;
  onSelect: (id: FieldGroupId) => void;
  /** `horizontal` is the phone strip; `vertical` is the desktop rail. */
  orientation?: "vertical" | "horizontal";
  /** Rendered above the list on the desktop rail. */
  children?: React.ReactNode;
}

type SectionState = "errors" | "advisories" | "complete" | "progress";

function sectionState(section: StepRailSection): SectionState {
  if (section.errors > 0) return "errors";
  if (section.requiredTotal > 0 && section.requiredFilled === section.requiredTotal) {
    return section.advisories > 0 ? "advisories" : "complete";
  }
  if (section.advisories > 0) return "advisories";
  return "progress";
}

/** The one line under a section name. Never says "error" about a blank field. */
function describeSection(section: StepRailSection, state: SectionState): string {
  if (state === "errors") {
    return `${section.errors} to fix`;
  }
  if (state === "complete") return "Done";
  if (state === "advisories" && section.requiredFilled === section.requiredTotal) {
    return `${section.advisories} to check`;
  }
  if (section.requiredTotal === 0) {
    return section.total === 0 ? "Nothing here" : "All optional";
  }
  return `${section.requiredFilled} of ${section.requiredTotal} filled`;
}

export const StepRail: React.FC<StepRailProps> = ({
  sections,
  active,
  onSelect,
  orientation = "vertical",
  children
}) => {
  const horizontal = orientation === "horizontal";

  return (
    <nav
      aria-label="Form sections"
      className={horizontal ? "w-full" : "flex min-h-0 flex-col gap-1"}
    >
      {children}
      <ol
        className={
          horizontal
            ? "flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1"
            : "flex flex-col gap-1"
        }
      >
        {sections.map((section, index) => {
          const state = sectionState(section);
          const isActive = section.id === active;
          const detail = describeSection(section, state);

          // The marker carries the section's state at a glance: a tick when it
          // is done, the step number until then. Colour is never the only
          // signal — the icon and the line of text both say it too.
          const marker =
            state === "complete" ? (
              <Check size={horizontal ? 15 : 17} strokeWidth={3} aria-hidden />
            ) : state === "errors" ? (
              <AlertCircle size={horizontal ? 15 : 17} strokeWidth={2.4} aria-hidden />
            ) : state === "advisories" ? (
              <CircleAlert size={horizontal ? 15 : 17} strokeWidth={2.4} aria-hidden />
            ) : (
              <span className="text-k-help font-bold leading-none">{index + 1}</span>
            );

          const markerClass =
            state === "complete"
              ? "bg-green-700 text-white dark:bg-green-600"
              : state === "errors"
                ? "bg-red-700 text-white dark:bg-red-600"
                : state === "advisories"
                  ? "border-2 border-amber-500 bg-amber-50 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200"
                  : isActive
                    ? "bg-brand-700 text-white dark:bg-brand-600"
                    : "border-2 border-gray-300 text-gray-600 dark:border-[#4A4A4A] dark:text-gray-400";

          return (
            <li key={section.id} className={horizontal ? "snap-start" : undefined}>
              <button
                type="button"
                onClick={() => onSelect(section.id)}
                aria-current={isActive ? "step" : undefined}
                className={
                  horizontal
                    ? `flex h-k-touch items-center gap-2 whitespace-nowrap rounded-k border px-3 text-k-help font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
                        isActive
                          ? "border-brand-700 bg-brand-50 text-brand-900 dark:border-brand-500 dark:bg-brand-900/40 dark:text-brand-100"
                          : "border-gray-300 bg-white text-gray-700 dark:border-[#3A3A3A] dark:bg-dark-surface dark:text-gray-300"
                      }`
                    : `flex w-full items-center gap-3 rounded-k px-3 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
                        isActive
                          ? "bg-brand-50 text-gray-900 shadow-[inset_3px_0_0_theme(colors.brand.700)] dark:bg-brand-900/30 dark:text-gray-50"
                          : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-dark-surface2"
                      }`
                }
              >
                <span
                  className={`inline-flex shrink-0 items-center justify-center rounded-full ${
                    horizontal ? "h-5 w-5" : "h-8 w-8"
                  } ${markerClass}`}
                >
                  {marker}
                </span>
                {horizontal ? (
                  <span>{section.label}</span>
                ) : (
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span
                      className={`text-k-label leading-tight ${isActive ? "font-bold" : "font-semibold"}`}
                    >
                      {section.label}
                    </span>
                    <span
                      className={`text-k-help ${
                        state === "errors"
                          ? "font-semibold text-red-700 dark:text-red-400"
                          : state === "advisories"
                            ? "font-semibold text-amber-800 dark:text-amber-400"
                            : state === "complete"
                              ? "text-green-800 dark:text-green-400"
                              : "text-gray-600 dark:text-gray-400"
                      }`}
                    >
                      {detail}
                    </span>
                  </span>
                )}
                {/* The horizontal strip has no room for the detail line, so the
                    state still has to reach a screen reader some other way. */}
                {horizontal && <span className="sr-only">{detail}</span>}
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
