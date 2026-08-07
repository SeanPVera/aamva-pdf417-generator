// Pure helpers behind the decorative flourishes. They live in core rather than
// beside their components so the components stay pure-component modules (React
// Fast Refresh only works when a file exports components alone) and so the
// logic stays unit-testable.

/** Formats a counter as a deli-counter ticket, e.g. 7 → "A-007". */
export function formatTicket(n: number): string {
  const letter = String.fromCharCode(65 + (Math.floor(n / 1000) % 26));
  return `${letter}-${String(n % 1000).padStart(3, "0")}`;
}

/** Parses a DAU value ("069 IN", "175 CM") into inches, or null if incomplete. */
export function parseHeightInches(value: string): number | null {
  const match = /^(\d{2,3})\s*(IN|CM)?$/i.exec(value.trim());
  if (!match) return null;
  const n = parseInt(match[1]!, 10);
  if (!Number.isFinite(n) || n <= 0) return null;
  return match[2]?.toUpperCase() === "CM" ? n / 2.54 : n;
}

/** The wry aside under the height chart, keyed to how implausible the value is. */
export function heightRemark(inches: number | null): string {
  if (inches === null) return "";
  if (inches < 36) return "Verify with a second clerk.";
  if (inches < 48) return "Slouching allowed.";
  if (inches > 84) return "Verify with a second clerk.";
  if (inches > 78) return "Duck on the way out.";
  return "";
}

/** Renders inches as a feet-and-inches label, e.g. 69 → `5'9"`. */
export function formatFeetInches(inches: number): string {
  const feet = Math.floor(inches / 12);
  const remainder = Math.round(inches % 12);
  // Rounding 11.6 up to 12 would print 5'12"; roll it into the next foot.
  if (remainder === 12) return `${feet + 1}'0"`;
  return `${feet}'${remainder}"`;
}
