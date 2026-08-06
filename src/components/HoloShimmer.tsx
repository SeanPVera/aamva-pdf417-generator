import React, { useEffect, useRef, useState } from "react";
import { getStateTheme } from "../core/stateThemes";

interface HoloShimmerProps {
  state: string;
  enabled: boolean;
}

/**
 * A purely cosmetic holographic overlay for the barcode preview, themed with
 * the selected jurisdiction's palette. It tracks the pointer on desktop and the
 * gyroscope on mobile so tilting the device sweeps the shimmer. It lives in the
 * DOM only — it never touches the canvas, so exports are unaffected.
 */
export const HoloShimmer: React.FC<HoloShimmerProps> = ({ state, enabled }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);

  useEffect(() => {
    if (!enabled || reduced) return;
    const el = ref.current;
    const parent = el?.parentElement;
    if (!el || !parent) return;

    const clamp = (n: number) => Math.max(0, Math.min(100, n));
    const setPos = (px: number, py: number) => {
      el.style.setProperty("--holo-x", `${clamp(px)}%`);
      el.style.setProperty("--holo-y", `${clamp(py)}%`);
    };
    const onPointer = (e: PointerEvent) => {
      const r = parent.getBoundingClientRect();
      setPos(((e.clientX - r.left) / r.width) * 100, ((e.clientY - r.top) / r.height) * 100);
    };
    const onTilt = (e: DeviceOrientationEvent) => {
      const gamma = e.gamma ?? 0; // left/right, [-90, 90]
      const beta = e.beta ?? 0; // front/back, [-180, 180]
      setPos(50 + (gamma / 90) * 50, 50 + (beta / 90) * 50);
    };
    parent.addEventListener("pointermove", onPointer);
    window.addEventListener("deviceorientation", onTilt);
    return () => {
      parent.removeEventListener("pointermove", onPointer);
      window.removeEventListener("deviceorientation", onTilt);
    };
  }, [enabled, reduced]);

  if (!enabled) return null;
  const theme = getStateTheme(state);
  const styleVars = {
    "--holo-primary": theme.primary,
    "--holo-accent": theme.accent
  } as React.CSSProperties;

  return (
    <div ref={ref} aria-hidden className="holo-shimmer" style={styleVars}>
      <span className="holo-microtext">{state}</span>
    </div>
  );
};
