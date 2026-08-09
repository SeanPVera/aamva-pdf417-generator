// DMV Bingo — a 5×5 card of things that actually happen while using this app.
// Squares are marked from the same decorative counters the badge board reads,
// so no field value is ever inspected.

export interface BingoSquare {
  id: string;
  text: string;
}

/** The free space, which is of course not free. */
export const FREE_SPACE: BingoSquare = {
  id: "free",
  text: "YOUR PAPERWORK IS INCOMPLETE"
};

// 24 squares + the free space at index 12 makes a 5×5 card.
export const BINGO_SQUARES: BingoSquare[] = [
  { id: "took-a-number", text: "Took a number" },
  { id: "strict-five", text: "Strict mode rejected you 5 times" },
  { id: "changed-state", text: "Changed state after filling the form" },
  { id: "lowercase-name", text: "Typed a name in lowercase" },
  { id: "regenerated-dd", text: "Regenerated the document discriminator" },
  { id: "read-the-help", text: "Actually read a help popover" },
  { id: "undo-five", text: "Undid five times in a row" },
  { id: "collapsed-all", text: "Collapsed every group at once" },
  { id: "searched-fields", text: "Searched the field list" },
  { id: "opened-shortcuts", text: "Opened the shortcuts sheet" },
  { id: "used-preset", text: "Gave up and used a preset" },
  { id: "scanned-card", text: "Scanned a real card" },
  { id: "batch-run", text: "Ran a batch job" },
  { id: "compared", text: "Compared two payloads" },
  { id: "exported-png", text: "Exported a PNG" },
  { id: "printed", text: "Sent it to a printer" },
  { id: "zoomed-in", text: "Zoomed all the way in" },
  { id: "dismissed-gus", text: "Dismissed the clerk" },
  { id: "konami", text: "Found the Konami code" },
  { id: "toggled-theme", text: "Toggled the theme three times" },
  { id: "cleared-all", text: "Cleared the whole form" },
  { id: "territory", text: "Selected a territory, not a state" },
  { id: "version-browser", text: "Browsed an AAMVA version you don't use" },
  { id: "night-owl", text: "Still here after midnight" }
];

/** Builds the 25-cell card with the free space in the middle. */
export function buildCard(): BingoSquare[] {
  const card = [...BINGO_SQUARES];
  card.splice(12, 0, FREE_SPACE);
  return card;
}

const LINES: number[][] = (() => {
  const lines: number[][] = [];
  for (let r = 0; r < 5; r++) lines.push([0, 1, 2, 3, 4].map((c) => r * 5 + c));
  for (let c = 0; c < 5; c++) lines.push([0, 1, 2, 3, 4].map((r) => r * 5 + c));
  lines.push([0, 6, 12, 18, 24]);
  lines.push([4, 8, 12, 16, 20]);
  return lines;
})();

/** Indices of every completed row, column, or diagonal. */
export function completedLines(marked: Set<string>): number[][] {
  const card = buildCard();
  const isMarked = (idx: number) => {
    const square = card[idx];
    return !!square && (square.id === FREE_SPACE.id || marked.has(square.id));
  };
  return LINES.filter((line) => line.every(isMarked));
}

export function isBlackout(marked: Set<string>): boolean {
  return BINGO_SQUARES.every((s) => marked.has(s.id));
}
