import React, { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { getClerkQuip, type ClerkMood } from "../core/clerkQuips";

interface ClerkMascotProps {
  enabled: boolean;
  errorCount: number;
  requiredComplete: boolean;
  anyFields: boolean;
}

const FACE: Record<ClerkMood, string> = {
  idle: "🧑‍💼",
  happy: "😄",
  error: "🤦",
  asleep: "😴"
};

const IDLE_MS = 18000;

/** "Gus", the pixel DMV clerk. Reacts to form state with dad-joke quips. */
export const ClerkMascot: React.FC<ClerkMascotProps> = ({
  enabled,
  errorCount,
  requiredComplete,
  anyFields
}) => {
  const [dismissed, setDismissed] = useState(false);
  const [asleep, setAsleep] = useState(false);
  const [seed, setSeed] = useState(0);
  const timerRef = useRef<number | undefined>(undefined);

  const baseMood: ClerkMood =
    errorCount > 0 ? "error" : requiredComplete && anyFields ? "happy" : "idle";
  const mood: ClerkMood = asleep ? "asleep" : baseMood;

  // Any change in form state wakes Gus and restarts the nap timer.
  useEffect(() => {
    setTimeout(() => setAsleep(false), 0);
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setAsleep(true), IDLE_MS);
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
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
        onClick={() => setDismissed(true)}
      >
        <X size={11} />
      </button>
      <div className="clerk-bubble">{quip}</div>
      <div className={`clerk-face clerk-${mood}`} aria-hidden>
        {FACE[mood]}
      </div>
    </div>
  );
};
