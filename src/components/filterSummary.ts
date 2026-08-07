/**
 * Builds the sentence shown when the field filters match nothing, naming the
 * filters that are actually active so the user knows what to undo.
 *
 * Kept separate from App.tsx so the wording can be unit tested without
 * rendering the whole application.
 */
export function describeActiveFilters(searchQuery: string, requiredOnly: boolean): string {
  const query = searchQuery.trim();
  const clauses: string[] = [];

  if (query) clauses.push(`the search “${query}”`);
  if (requiredOnly) clauses.push("the Required filter");

  if (clauses.length === 0) {
    // Defensive: with no filters active there should be fields to show, so
    // this only surfaces if a jurisdiction/version genuinely defines none.
    return "This jurisdiction and version combination has no fields to display.";
  }

  return `No fields match ${clauses.join(" and ")}. Try adjusting or resetting your filters.`;
}
