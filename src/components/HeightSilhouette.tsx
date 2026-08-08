import React from "react";
import { parseHeightInches, heightRemark, formatFeetInches } from "../core/whimsy";

interface HeightSilhouetteProps {
  /** The raw DAU value, e.g. "069 IN" or "175 CM". */
  value: string;
}

const MIN_IN = 36;
const MAX_IN = 90;

/**
 * A one-bit figure against a booking-photo height chart, sized live from DAU.
 * Decorative only — it renders next to the field and never touches the payload.
 */
export const HeightSilhouette: React.FC<HeightSilhouetteProps> = ({ value }) => {
  const inches = parseHeightInches(value);
  if (inches === null) return null;

  const clamped = Math.max(MIN_IN, Math.min(MAX_IN, inches));
  const fraction = (clamped - MIN_IN) / (MAX_IN - MIN_IN);
  // Figure occupies 8–28px of the chart.
  const figureHeight = 8 + fraction * 20;
  const remark = heightRemark(inches);
  const label = formatFeetInches(inches);

  return (
    <span className="height-silhouette" title={remark ? `${label} — ${remark}` : label} aria-hidden>
      <span className="height-chart">
        <span className="height-figure" style={{ height: `${figureHeight}px` }}>
          <span className="height-head" />
          <span className="height-body" />
        </span>
      </span>
      <span className="height-readout">{label}</span>
    </span>
  );
};
