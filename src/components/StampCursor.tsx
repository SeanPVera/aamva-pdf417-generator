import React from "react";

interface StampCursorProps {
  enabled: boolean;
}

interface Impression {
  id: number;
  xPct: number;
  yPct: number;
  angle: number;
}

const MAX_IMPRESSIONS = 8;

/**
 * Turns the preview into a stamping surface: the cursor becomes a rubber stamp
 * and clicking thunks a rotated SPECIMEN impression onto an overlay.
 *
 * The impressions live in a sibling DOM layer, never on the canvas — which is
 * both the joke and the safety property, since the exported PNG is produced by
 * re-encoding the payload and cannot pick them up.
 */
export const StampCursor: React.FC<StampCursorProps> = ({ enabled }) => {
  const [impressions, setImpressions] = React.useState<Impression[]>([]);
  const nextId = React.useRef(0);

  if (!enabled) return null;

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const xPct = ((e.clientX - rect.left) / rect.width) * 100;
    const yPct = ((e.clientY - rect.top) / rect.height) * 100;
    nextId.current += 1;
    const id = nextId.current;
    // ±6° of wobble, deterministic per impression so re-renders don't jitter.
    const angle = ((id * 37) % 13) - 6;
    setImpressions((list) => [...list, { id, xPct, yPct, angle }].slice(-MAX_IMPRESSIONS));
  };

  return (
    <div
      className="stamp-surface"
      onClick={handleClick}
      onDoubleClick={() => setImpressions([])}
      title="Click to stamp. Double-click to clear."
      aria-hidden
    >
      {impressions.map((imp) => (
        <span
          key={imp.id}
          className="stamp-impression"
          style={{
            left: `${imp.xPct}%`,
            top: `${imp.yPct}%`,
            transform: `translate(-50%, -50%) rotate(${imp.angle}deg)`
          }}
        >
          SPECIMEN
        </span>
      ))}
    </div>
  );
};
