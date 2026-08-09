import React from "react";
import { ShieldCheck } from "lucide-react";
import { InstallPrompt } from "./InstallPrompt";

interface HeaderBrandProps {
  state: string;
  activeStateName: string;
  activeStateTheme: { motif: string };
}

export const HeaderBrand: React.FC<HeaderBrandProps> = ({
  state,
  activeStateName,
  activeStateTheme,
}) => {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center space-x-2 sm:space-x-3 shrink min-w-0">
        <ShieldCheck className="state-brand-icon h-5 w-5 text-brand-600 dark:text-brand-400 shrink-0" />
        <h1 className="state-brand-text text-base sm:text-lg font-bold tracking-wide whitespace-nowrap overflow-hidden text-ellipsis">
          AAMVA PDF417 Generator
        </h1>
        <span className="hidden sm:inline state-badge dmv-badge bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 text-xs py-0.5 px-2 rounded-full border border-brand-200 dark:border-brand-800/50 whitespace-nowrap">
          Professional Grade
        </span>
        <span
          className="jurisdiction-plate hidden md:inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.16em] shadow-sm whitespace-nowrap"
          title={`${activeStateName} theme package: ${activeStateTheme.motif}`}
        >
          {state} · {activeStateTheme.motif}
        </span>
      </div>
      <InstallPrompt />
    </div>
  );
};
