// Builds filesystem-friendly basenames for exported artifacts.
//
// By default the basename carries NO personal data: the cardholder's name is
// PII, and a filename is the one place it escapes the tab — downloads folders
// are indexed by the OS, synced by drive clients, and visible in the file
// picker during a screen share. The app's whole posture is that field values
// never reach disk, so the default basename is jurisdiction + document type +
// version + a short slice of the document discriminator, which stays unique
// per card without naming anyone.
//
// Callers that genuinely want legible filenames can opt in per export with
// `includeName`, which restores the older `barcode_CA_DOE_JANE_DL` shape.

export interface ExportNameInput {
  state: string;
  version: string;
  fields: Record<string, string>;
  subfileType?: "DL" | "ID";
  /** Leading token, e.g. "barcode" or "aamva". */
  prefix?: string;
  /**
   * Opt in to embedding the cardholder's family/given name in the basename.
   * Defaults to false — see the module comment.
   */
  includeName?: boolean;
}

/** Uppercase, strip anything that isn't A-Z/0-9, collapse repeats. */
function sanitizePart(value: string | undefined): string {
  if (!value) return "";
  return value
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "")
    .slice(0, 24);
}

/**
 * Splits a combined v01-style full-name field (`DAA`) into family/given tokens.
 * AAMVA combined names are typically comma-delimited ("DOE,JANE,Q") but space
 * delimiting is tolerated.
 */
function splitCombinedName(daa: string | undefined): { family: string; given: string } {
  if (!daa) return { family: "", given: "" };
  const tokens = daa.split(/[,\s]+/).filter(Boolean);
  return { family: tokens[0] ?? "", given: tokens[1] ?? "" };
}

export function buildExportBasename(input: ExportNameInput): string {
  const { state, version, fields, subfileType = "DL", prefix, includeName = false } = input;

  const parts: string[] = [];
  if (prefix) parts.push(sanitizePart(prefix) || prefix);
  parts.push(sanitizePart(state) || "AAMVA");

  if (includeName) {
    const combined = splitCombinedName(fields.DAA);
    const family = sanitizePart(fields.DCS || combined.family);
    const given = sanitizePart(fields.DAC || combined.given);
    if (family) parts.push(family);
    if (given) parts.push(given);
    parts.push(subfileType);
    // Keep names distinguishable when no personal name is present.
    if (!family && !given) parts.push("V" + sanitizePart(version));
    return parts.filter(Boolean).join("_");
  }

  parts.push(subfileType);
  parts.push("V" + sanitizePart(version));
  // The document discriminator is a per-card identifier, not a personal one, so
  // a short slice keeps sibling exports apart without naming the cardholder.
  const discriminator = sanitizePart(fields.DCF).slice(0, 8);
  if (discriminator) parts.push(discriminator);

  return parts.filter(Boolean).join("_");
}
