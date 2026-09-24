// Export filenames contain jurisdiction, document type, and version by default.
// Neither names nor document identifiers belong in indexed download filenames.
// The user may explicitly opt in to names; that does not make an export private.

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

  return parts.filter(Boolean).join("_");
}
