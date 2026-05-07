import React from "react";

interface UseSwipeOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  /** Minimum horizontal distance (px) to count as a swipe. */
  threshold?: number;
  /** Maximum vertical drift before the gesture is treated as a scroll. */
  maxVerticalDrift?: number;
  /** Skip if the user is interacting with these tag names. */
  ignoreTags?: ReadonlyArray<string>;
}

const DEFAULT_IGNORE_TAGS = ["INPUT", "TEXTAREA", "SELECT", "BUTTON", "A"] as const;

/**
 * Lightweight horizontal swipe detector for touch devices. Listens to
 * pointer events on the target element and fires the configured callback
 * once the gesture exceeds the threshold and ends.
 *
 * Designed for the mobile panel nav in App.tsx — kept tiny on purpose so
 * we don't pull in a gesture library for one feature.
 */
export function useSwipe<T extends HTMLElement>({
  onSwipeLeft,
  onSwipeRight,
  threshold = 50,
  maxVerticalDrift = 80,
  ignoreTags = DEFAULT_IGNORE_TAGS
}: UseSwipeOptions): React.RefObject<T | null> {
  const ref = React.useRef<T | null>(null);
  const startRef = React.useRef<{ x: number; y: number } | null>(null);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const isInteractive = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) return false;
      if (target.isContentEditable) return true;
      return ignoreTags.includes(target.tagName);
    };

    const handleStart = (e: PointerEvent) => {
      if (e.pointerType !== "touch") return;
      if (isInteractive(e.target)) return;
      startRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleEnd = (e: PointerEvent) => {
      const start = startRef.current;
      startRef.current = null;
      if (!start || e.pointerType !== "touch") return;

      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;
      if (Math.abs(dy) > maxVerticalDrift) return;
      if (dx <= -threshold) onSwipeLeft?.();
      else if (dx >= threshold) onSwipeRight?.();
    };

    el.addEventListener("pointerdown", handleStart);
    el.addEventListener("pointerup", handleEnd);
    el.addEventListener("pointercancel", () => {
      startRef.current = null;
    });
    return () => {
      el.removeEventListener("pointerdown", handleStart);
      el.removeEventListener("pointerup", handleEnd);
    };
  }, [onSwipeLeft, onSwipeRight, threshold, maxVerticalDrift, ignoreTags]);

  return ref;
}
