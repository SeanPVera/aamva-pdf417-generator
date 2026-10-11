import React from "react";
import type { FieldGroupId } from "../core/schema";
export interface StepRailSection {
  id: FieldGroupId;
  label: string;
  total: number;
  requiredTotal: number;
  requiredFilled: number;
  errors: number;
  advisories: number;
}
interface StepRailProps {
  sections: StepRailSection[];
  active: FieldGroupId;
  onSelect: (id: FieldGroupId) => void;
  orientation?: "vertical" | "horizontal";
  children?: React.ReactNode;
}
export const StepRail: React.FC<StepRailProps> = ({ sections, active, onSelect, children }) => {
  const helpId = React.useId();
  return (
    <nav aria-label="Form sections" className="record-sections">
      {children}
      <span id={helpId} className="sr-only">
        Show fields in this section
      </span>
      <ol>
        {sections.map((s, index) => {
          const labelId = `${helpId}-${s.id}-label`;
          const detailId = `${helpId}-${s.id}-detail`;
          const detail = s.errors
            ? `${s.errors} to fix`
            : s.advisories && s.requiredFilled === s.requiredTotal
              ? `${s.advisories} to check`
              : !s.requiredTotal
                ? "All optional"
                : s.requiredFilled === s.requiredTotal
                  ? "Done"
                  : `${s.requiredFilled} of ${s.requiredTotal} filled`;
          return (
            <li key={s.id}>
              <button
                onClick={() => onSelect(s.id)}
                aria-current={s.id === active ? "step" : undefined}
                className={s.id === active ? "active" : ""}
                title={`${s.label} — ${detail}`}
                aria-labelledby={`${labelId} ${detailId}`}
                aria-describedby={helpId}
              >
                <span className="section-number" aria-hidden>
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span id={labelId}>{s.label}</span>
                {s.errors > 0 && (
                  <span className="section-error" aria-hidden>
                    !
                  </span>
                )}
                <span id={detailId} className="sr-only">
                  {detail}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
