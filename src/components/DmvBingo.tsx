import React from "react";
import { X, Tag, RotateCcw } from "lucide-react";
import { buildCard, completedLines, isBlackout, FREE_SPACE } from "../core/bingo";
import { useModalShell } from "../hooks/useModalShell";

interface DmvBingoProps {
  open: boolean;
  onClose: () => void;
  marked: string[];
  onReset: () => void;
}

/**
 * A 5×5 card of things that actually happen while using this app. Squares are
 * marked by the same decorative counters the badge board reads.
 */
export const DmvBingo: React.FC<DmvBingoProps> = ({ open, onClose, marked, onReset }) => {
  const dialogRef = useModalShell<HTMLDivElement>({ open, onClose });
  const markedSet = React.useMemo(() => new Set(marked), [marked]);
  const card = React.useMemo(() => buildCard(), []);
  const lines = React.useMemo(() => completedLines(markedSet), [markedSet]);
  const blackout = isBlackout(markedSet);
  const winningCells = React.useMemo(() => new Set(lines.flat()), [lines]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="bingo-title"
        className="w-full max-w-lg bg-white dark:bg-dark-surface rounded-lg shadow-xl border border-gray-200 dark:border-dark-border max-h-[88vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-dark-border">
          <h2
            id="bingo-title"
            className="flex items-center gap-2 text-base font-semibold text-gray-800 dark:text-gray-100"
          >
            <Tag size={16} />
            DMV Bingo
            {lines.length > 0 && (
              <span className="text-[10px] font-bold uppercase tracking-widest text-red-600 dark:text-red-400">
                {blackout ? "Blackout" : "Bingo"}
              </span>
            )}
          </h2>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onReset}
              aria-label="Reset the bingo card"
              title="Reset the card"
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-dark-surface2 text-gray-600 dark:text-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              <RotateCcw size={14} />
            </button>
            <button
              data-autofocus
              type="button"
              onClick={onClose}
              aria-label="Close bingo"
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-dark-surface2 text-gray-600 dark:text-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-5 gap-1.5">
            {card.map((square, idx) => {
              const isFree = square.id === FREE_SPACE.id;
              const isMarked = isFree || markedSet.has(square.id);
              const isWinning = winningCells.has(idx);
              return (
                <div
                  key={square.id}
                  className={`bingo-cell ${isMarked ? "bingo-cell-marked" : ""} ${
                    isWinning ? "bingo-cell-winning" : ""
                  } ${isFree ? "bingo-cell-free" : ""}`}
                >
                  <span>{square.text}</span>
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-[11px] text-gray-400 dark:text-gray-500">
            {markedSet.size} of 24 squares marked. Squares fill in as you use the app — nothing here
            inspects what you typed.
          </p>
          {blackout && (
            <p className="mt-2 text-xs font-semibold text-gray-700 dark:text-gray-200">
              Blackout. Your prize is this sentence.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
