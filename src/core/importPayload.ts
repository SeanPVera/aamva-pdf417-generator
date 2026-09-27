import { AAMVA_VERSION_KEYS, isSupportedVersion } from "./schema";
import { AAMVA_STATES } from "./states";

/** Resource limit for a single record, not a claim about barcode capacity. */
export const MAX_IMPORT_BYTES = 1_000_000;

export function validateImportedRecord(parsed: unknown, label = "This file"): ImportResult {
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { ok: false, error: "Invalid JSON: expected a single payload object." };
  }
  const source = parsed as Record<string, unknown>;
  const data: Record<string, string> = {};
  for (const [key, value] of Object.entries(source)) {
    // Unknown metadata is not form data. Keep well-formed element codes,
    // including opaque Z* extensions, for inspection and explicit export.
    if (!["state", "version", "subfileType"].includes(key) && !/^[A-Z]{2}[A-Z0-9]$/.test(key))
      continue;
    if (typeof value !== "string") {
      return { ok: false, error: `${key} must be text; numeric identifiers lose leading zeros.` };
    }
    data[key] = value;
  }
  if (data.state !== undefined) data.state = data.state.toUpperCase();
  if (data.state !== undefined && !Object.prototype.hasOwnProperty.call(AAMVA_STATES, data.state)) {
    return { ok: false, error: "Unknown issuing jurisdiction." };
  }
  if (data.version !== undefined && !isSupportedVersion(data.version)) {
    return {
      ok: false,
      error: `${label} is AAMVA version ${data.version}, which this build does not support. Supported versions: ${AAMVA_VERSION_KEYS.join(", ")}.`
    };
  }
  if (data.subfileType !== undefined && data.subfileType !== "DL" && data.subfileType !== "ID") {
    return { ok: false, error: "Subfile type must be DL or ID." };
  }
  return { ok: true, data };
}

export type ImportResult =
  | { ok: true; data: Record<string, string> }
  | { ok: false; error: string };

/**
 * Parses and validates a JSON payload file before it reaches `loadJson`.
 *
 * Shared by every import path — the header file picker and the drag-and-drop
 * overlay — because each one used to carry its own copy of the parse/shape
 * checks. When the unsupported-version guard was added to one of them, the
 * other silently kept accepting a file naming a version this build has no field
 * table for, which switched the store to a schema with no fields and left the
 * user looking at an empty form.
 *
 * @param text Raw file contents.
 * @param label Filename, used in the version error so the user knows which file.
 */
export function parseImportedPayload(text: string, label = "This file"): ImportResult {
  if (typeof text !== "string" || text.length > MAX_IMPORT_BYTES) {
    return { ok: false, error: "This record is too large to import (1 MB limit)." };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(text.replace(/^\uFEFF/, ""));
  } catch {
    return { ok: false, error: "Failed to parse JSON file. Check the file format." };
  }

  return validateImportedRecord(parsed, label);
}
