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
export const StepRail: React.FC<StepRailProps> = ({ sections, active, onSelect, children }) => (
  <nav aria-label="Form sections" className="record-sections">
    {children}
    <ol>
      {sections.map((s, index) => {
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
            >
              <span className="section-number" aria-hidden>
                {String(index + 1).padStart(2, "0")}
              </span>
              <span>{s.label}</span>
              {s.errors > 0 && (
                <span className="section-error" aria-hidden>
                  !
                </span>
              )}
              <span className="sr-only">{detail}</span>
            </button>
          </li>
        );
      })}
    </ol>
  </nav>
);
