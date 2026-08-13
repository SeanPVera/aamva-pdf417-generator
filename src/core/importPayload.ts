import { AAMVA_VERSION_KEYS, isSupportedVersion } from "./schema";

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
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, error: "Failed to parse JSON file. Check the file format." };
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { ok: false, error: "Invalid JSON: expected a single payload object." };
  }

  const version = (parsed as Record<string, unknown>).version;
  if (typeof version === "string" && !isSupportedVersion(version)) {
    return {
      ok: false,
      error:
        `${label} is AAMVA version ${version}, which this build does not support. ` +
        `Supported versions: ${AAMVA_VERSION_KEYS.join(", ")}.`
    };
  }

  return { ok: true, data: parsed as Record<string, string> };
}
