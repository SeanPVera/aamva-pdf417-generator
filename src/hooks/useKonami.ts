import { useEffect, useRef } from "react";

// The classic: ↑ ↑ ↓ ↓ ← → ← → B A. Fires `onTrigger` when entered. Restarts
// the matcher on any wrong key (but lets a fresh ↑ begin a new attempt).
const SEQUENCE = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "b",
  "a"
];

export function useKonami(onTrigger: () => void): void {
  const idxRef = useRef(0);
  const cbRef = useRef(onTrigger);

  useEffect(() => {
    cbRef.current = onTrigger;
  });

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (key === SEQUENCE[idxRef.current]) {
        idxRef.current += 1;
        if (idxRef.current === SEQUENCE.length) {
          idxRef.current = 0;
          cbRef.current();
        }
      } else {
        idxRef.current = key === SEQUENCE[0] ? 1 : 0;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
}
