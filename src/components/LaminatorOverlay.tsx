import React from "react";

interface LaminatorOverlayProps {
  /** Increment to run the animation once. 0 means "never run". */
  runKey: number;
  enabled: boolean;
}

/**
 * Runs the barcode between two hot rollers on export, then leaves a brief heat
 * shimmer. A DOM overlay only — it never draws to the canvas, so the exported
 * bytes are identical whether or not this is on.
 */
export const LaminatorOverlay: React.FC<LaminatorOverlayProps> = ({ runKey, enabled }) => {
  // Which run has already finished. Derived comparison rather than a timer:
  // the animation itself tells us when it is done.
  const [finishedKey, setFinishedKey] = React.useState(0);
  const running = enabled && runKey > 0 && runKey !== finishedKey;

  if (!running) return null;

  return (
    <div
      key={runKey}
      className="laminator"
      aria-hidden
      onAnimationEnd={(e) => {
        // Several elements animate; the sheen is the longest and finishes last.
        if (e.currentTarget === e.target || e.animationName.includes("sheen")) {
          setFinishedKey(runKey);
        }
      }}
    >
      <span className="laminator-roller laminator-roller-top" />
      <span className="laminator-roller laminator-roller-bottom" />
      <span className="laminator-sheen" />
      <span className="laminator-heat" />
    </div>
  );
};
