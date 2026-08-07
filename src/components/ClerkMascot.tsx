import React, { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { getClerkQuip, type ClerkMood } from "../core/clerkQuips";

interface ClerkMascotProps {
  enabled: boolean;
  errorCount: number;
  requiredComplete: boolean;
  anyFields: boolean;
  onDismiss?: () => void;
}

const FACE: Record<ClerkMood, string> = {
  idle: "🧑‍💼",
  happy: "😄",
  error: "🤦",
  asleep: "😴",
  break: "🚶"
};

const IDLE_MS = 18000;
/** Long enough that he is plainly not coming back on his own. */
const BREAK_MS = 5 * 60 * 1000;

/** "Gus", the pixel DMV clerk. Reacts to form state with dad-joke quips. */
export const ClerkMascot: React.FC<ClerkMascotProps> = ({
  enabled,
  errorCount,
  requiredComplete,
  anyFields,
  onDismiss
}) => {
  const [dismissed, setDismissed] = useState(false);
  const [asleep, setAsleep] = useState(false);
  const [onBreak, setOnBreak] = useState(false);
  const [seed, setSeed] = useState(0);
  const timerRef = useRef<number | undefined>(undefined);
  const breakTimerRef = useRef<number | undefined>(undefined);

  const baseMood: ClerkMood =
    errorCount > 0 ? "error" : requiredComplete && anyFields ? "happy" : "idle";
  const mood: ClerkMood = onBreak ? "break" : asleep ? "asleep" : baseMood;

  // Any change in form state wakes Gus, ends the break, and restarts both timers.
  useEffect(() => {
    setTimeout(() => {
      setAsleep(false);
      setOnBreak(false);
    }, 0);
    if (timerRef.current) window.clearTimeout(timerRef.current);
    if (breakTimerRef.current) window.clearTimeout(breakTimerRef.current);
    timerRef.current = window.setTimeout(() => setAsleep(true), IDLE_MS);
    breakTimerRef.current = window.setTimeout(() => setOnBreak(true), BREAK_MS);
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      if (breakTimerRef.current) window.clearTimeout(breakTimerRef.current);
    };
  }, [errorCount, requiredComplete, anyFields]);

  // Freshen the quip when the mood flips and on a slow rotation.
  useEffect(() => {
    setTimeout(() => setSeed((s) => s + 1), 0);
  }, [mood]);
  useEffect(() => {
    const id = window.setInterval(() => setSeed((s) => s + 1), 14000);
    return () => window.clearInterval(id);
  }, []);

  if (!enabled || dismissed) return null;
  const quip = getClerkQuip(mood, seed);

  return (
    <div className="clerk-mascot" role="status" aria-live="off">
      <button
        type="button"
        className="clerk-dismiss"
        aria-label="Hide the clerk mascot"
        onClick={() => {
          setDismissed(true);
          onDismiss?.();
        }}
      >
        <X size={11} />
      </button>
      {mood === "break" && (
        <div className="clerk-break-sign" aria-hidden>
          Back in
          <strong>15 minutes</strong>
        </div>
      )}
      <div className="clerk-bubble">{quip}</div>
      <div className={`clerk-face clerk-${mood}`} aria-hidden>
        {FACE[mood]}
      </div>
    </div>
  );
};
