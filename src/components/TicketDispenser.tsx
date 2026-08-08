import React from "react";
import { formatTicket } from "../core/whimsy";

interface TicketDispenserProps {
  enabled: boolean;
  /** Barcodes generated so far — drives the flip board. */
  served: number;
  onTakeTicket?: () => void;
}

/**
 * A take-a-number ticket stub and a NOW SERVING flip board. Your number is
 * assigned once at mount; the board advances as barcodes generate, which makes
 * a batch run into something worth watching.
 */
export const TicketDispenser: React.FC<TicketDispenserProps> = ({
  enabled,
  served,
  onTakeTicket
}) => {
  // Lazy initializer, so the number is drawn exactly once without an effect.
  // Start a few ahead: there is always someone in front of you.
  const [ticket] = React.useState(() => served + 3);
  const [dismissed, setDismissed] = React.useState(false);

  React.useEffect(() => {
    if (enabled) onTakeTicket?.();
    // Fires once per mount — taking a number is not a repeatable event.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!enabled || dismissed) return null;

  const yourTurn = served >= ticket;

  return (
    // The decorative panels are hidden from assistive tech, but the dismiss
    // control is not — an aria-hidden subtree containing a focusable button is
    // a real trap for keyboard and screen-reader users, so the two are marked
    // separately rather than hiding the whole widget.
    <div className={`ticket-dispenser${yourTurn ? " ticket-your-turn" : ""}`}>
      <button
        type="button"
        className="ticket-dismiss"
        aria-label="Hide the queue ticket"
        onClick={() => setDismissed(true)}
      >
        <span aria-hidden>×</span>
      </button>
      <div className="ticket-board" aria-hidden>
        <div className="ticket-board-label">Now Serving</div>
        <div className="ticket-board-number">{formatTicket(served)}</div>
      </div>
      <div className="ticket-stub" aria-hidden>
        <div className="ticket-stub-label">Your number</div>
        <div className="ticket-stub-number">{formatTicket(ticket)}</div>
        <div className="ticket-stub-note">
          {yourTurn ? "That's you. Step right up." : `${ticket - served} ahead of you`}
        </div>
      </div>
    </div>
  );
};
