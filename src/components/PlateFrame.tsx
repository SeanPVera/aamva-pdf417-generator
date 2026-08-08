import React from "react";
import { getStatePlate } from "../core/stateSlogans";
import { getStateTheme } from "../core/stateThemes";

interface PlateFrameProps {
  state: string;
  enabled: boolean;
  children: React.ReactNode;
}

/**
 * Wraps the barcode in a jurisdiction-correct license plate frame — name line,
 * the state's actual slogan, and a bolt in each corner. Decorative chrome
 * around the canvas; the canvas and every export are untouched.
 */
export const PlateFrame: React.FC<PlateFrameProps> = ({ state, enabled, children }) => {
  if (!enabled) return <>{children}</>;

  const plate = getStatePlate(state);
  const theme = getStateTheme(state);

  return (
    <div
      className="plate-frame"
      style={
        {
          "--plate-ink": theme.primary,
          "--plate-accent": theme.accent
        } as React.CSSProperties
      }
    >
      <span className="plate-bolt plate-bolt-tl" aria-hidden />
      <span className="plate-bolt plate-bolt-tr" aria-hidden />
      <span className="plate-bolt plate-bolt-bl" aria-hidden />
      <span className="plate-bolt plate-bolt-br" aria-hidden />
      <div className="plate-title" aria-hidden>
        {plate.title}
      </div>
      <div className="plate-window">{children}</div>
      <div className="plate-slogan" aria-hidden>
        {plate.slogan}
      </div>
    </div>
  );
};
