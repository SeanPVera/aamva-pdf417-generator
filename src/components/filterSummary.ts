/**
 * Builds the sentence shown when the field filters match nothing, naming the
 * filters that are actually active so the user knows what to undo.
 *
 * Kept separate from App.tsx so the wording can be unit tested without
 * rendering the whole application.
 */
export function describeActiveFilters(
  searchQuery: string,
  requiredOnly: boolean,
  issuesOnly: boolean,
  issueCount: number
): string {
  // The issues filter with a clean form is good news, not a dead end — say so
  // rather than implying the user mis-filtered.
  if (issuesOnly && issueCount === 0) {
    return "No validation issues — nothing to show with the issues filter on.";
  }

  const query = searchQuery.trim();
  const clauses: string[] = [];

  if (query) clauses.push(`the search “${query}”`);
  if (requiredOnly) clauses.push("the Required filter");
  if (issuesOnly) clauses.push("the Issues filter");

  if (clauses.length === 0) {
    // Defensive: with no filters active there should be fields to show, so
    // this only surfaces if a jurisdiction/version genuinely defines none.
    return "This jurisdiction and version combination has no fields to display.";
  }

  const joined =
    clauses.length === 1
      ? clauses[0]
      : `${clauses.slice(0, -1).join(", ")} and ${clauses[clauses.length - 1]}`;

  return `No fields match ${joined}. Try adjusting or resetting your filters.`;
}
