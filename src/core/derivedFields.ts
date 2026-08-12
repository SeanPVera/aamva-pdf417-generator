// Field codes the app fills on the user's behalf, and the "did the user enter
// anything" question that has to look past them.
//
// `DAJ` is the jurisdiction code. `generateAAMVAPayload` forces it to the
// selected state whatever the form holds, so the app fills it from the picker
// rather than leaving a required field nobody could satisfy. That makes it
// present on a form nobody has touched — and every dirty-state check in the UI
// (the unsaved-work prompt, the mobile bar's empty state, whether an import
// needs an Undo, how many fields "Clear PII" actually cleared) would otherwise
// read a blank form as populated.

/** Codes written by `setDerivedField` rather than by the user. */
export const DERIVED_FIELD_CODES: ReadonlySet<string> = new Set(["DAJ"]);

/** True when `code` is app-owned rather than user-entered. */
export function isDerivedField(code: string): boolean {
  return DERIVED_FIELD_CODES.has(code);
}

/** Field codes holding a value the user actually put there. */
export function userEnteredCodes(fields: Record<string, string>): string[] {
  return Object.entries(fields)
    .filter(([code, value]) => !isDerivedField(code) && (value ?? "").trim().length > 0)
    .map(([code]) => code);
}

/** True when the form holds any value the user actually put there. */
export function hasUserData(fields: Record<string, string>): boolean {
  return Object.entries(fields).some(
    ([code, value]) => !isDerivedField(code) && (value ?? "").trim().length > 0
  );
}
