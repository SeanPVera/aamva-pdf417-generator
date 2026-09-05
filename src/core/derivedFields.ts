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

/**
 * Values the app wrote itself, so a caller can tell them from typing.
 *
 * `DERIVED_FIELD_CODES` covers codes the app owns outright. This covers the
 * other case: a code the user MAY edit that the app happened to pre-fill.
 * Matching on the value rather than the code is what keeps `DCG` counted as
 * user data the moment somebody changes it from the seeded "USA".
 */
function isUntouchedAppValue(
  code: string,
  value: string,
  appWritten: Record<string, string> | undefined
): boolean {
  if (!appWritten) return false;
  const seeded = appWritten[code];
  return seeded !== undefined && (value ?? "").trim() === seeded.trim();
}

/**
 * Field codes holding a value the user actually put there.
 *
 * `appWritten` is what the app seeded — pass it and an untouched seed stops
 * counting. Without it a form nobody had typed into reported four filled
 * fields, so the unsaved-work prompt fired on every refresh of a blank page
 * and "Clear PII" claimed to have cleared values that were never entered.
 */
export function userEnteredCodes(
  fields: Record<string, string>,
  appWritten?: Record<string, string>
): string[] {
  return Object.entries(fields)
    .filter(
      ([code, value]) =>
        !isDerivedField(code) &&
        (value ?? "").trim().length > 0 &&
        !isUntouchedAppValue(code, value, appWritten)
    )
    .map(([code]) => code);
}

/** True when the form holds any value the user actually put there. */
export function hasUserData(
  fields: Record<string, string>,
  appWritten?: Record<string, string>
): boolean {
  return Object.entries(fields).some(
    ([code, value]) =>
      !isDerivedField(code) &&
      (value ?? "").trim().length > 0 &&
      !isUntouchedAppValue(code, value, appWritten)
  );
}
