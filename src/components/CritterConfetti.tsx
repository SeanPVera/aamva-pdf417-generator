import React from "react";

interface CritterConfettiProps {
  emoji: string;
  /** Increment to fire a fresh burst; 0 means "never fired". */
  fireKey: number;
  enabled: boolean;
}

const PIECES = 14;

/**
 * Deterministic pseudo-random float in [0, 1).
 * Pure: same seed always returns the same value, so renders stay idempotent.
 * Different fireKey values produce visually distinct bursts.
 */
function seededRand(seed: number): number {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

/** A one-shot burst of the jurisdiction's state-animal emoji. */
export const CritterConfetti: React.FC<CritterConfettiProps> = ({ emoji, fireKey, enabled }) => {
  if (!enabled || fireKey === 0) return null;

  return (
    <div key={fireKey} aria-hidden className="critter-confetti">
      {Array.from({ length: PIECES }).map((_, i) => {
        const base = fireKey * 100 + i * 7;
        const style = {
          left: `${seededRand(base) * 100}%`,
          animationDelay: `${seededRand(base + 1) * 0.2}s`,
          animationDuration: `${1 + seededRand(base + 2) * 0.8}s`,
          "--drift": `${(seededRand(base + 3) * 2 - 1) * 60}px`,
          "--rot": `${(seededRand(base + 4) * 2 - 1) * 360}deg`
        } as React.CSSProperties;
        return (
          <span key={i} className="critter-piece" style={style}>
            {emoji}
          </span>
        );
      })}
    </div>
  );
};
