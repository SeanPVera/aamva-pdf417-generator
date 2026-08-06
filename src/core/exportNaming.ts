// Builds filesystem-friendly basenames for exported artifacts so a downloads
// folder stays legible — e.g. `barcode_CA_DOE_JANE_DL` instead of
// `barcode_CA_10`. Name fields are optional; the basename degrades gracefully
// to the jurisdiction + version when no name is present.

export interface ExportNameInput {
  state: string;
  version: string;
  fields: Record<string, string>;
  subfileType?: "DL" | "ID";
  /** Leading token, e.g. "barcode" or "aamva". */
  prefix?: string;
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
  const { state, version, fields, subfileType = "DL", prefix } = input;
  const combined = splitCombinedName(fields.DAA);
  const family = sanitizePart(fields.DCS || combined.family);
  const given = sanitizePart(fields.DAC || combined.given);

  const parts: string[] = [];
  if (prefix) parts.push(sanitizePart(prefix) || prefix);
  parts.push(sanitizePart(state) || "AAMVA");
  if (family) parts.push(family);
  if (given) parts.push(given);
  parts.push(subfileType);
  // Keep names distinguishable when no personal name is present.
  if (!family && !given) parts.push("V" + sanitizePart(version));

  return parts.filter(Boolean).join("_");
}
