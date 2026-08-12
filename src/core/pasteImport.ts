// Turns arbitrary clipboard text into something the form can load.
//
// The app could already take a payload three ways — a file picker, a drag-drop,
// and a webcam scan — but not the way people actually move a payload around,
// which is copying the string out of a scanner app, a bug report, or a test
// fixture and hitting paste. This classifies whatever landed on the clipboard
// and returns a field map, or an honest reason why it can't.

import { decodePayload } from "./decoder";
import { parseImportedPayload } from "./importPayload";
import { AAMVA_STATES } from "./states";
import { AAMVA_VERSIONS, isSupportedVersion, AAMVA_VERSION_KEYS } from "./schema";

export type PasteKind = "aamva" | "json" | "unknown";

export type SubfileType = "DL" | "ID";

export interface PasteImportResult {
  kind: PasteKind;
  /** Field map ready for `loadJson`, or null when nothing usable was found. */
  data: Record<string, string> | null;
  /** How many AAMVA field codes the paste carried. */
  fieldCount: number;
  /**
   * DL or ID, read from the payload's subfile directory. The store keeps this
   * outside the field map, so the caller has to apply it separately — without
   * it, pasting an ID payload into a form set to DL silently re-encodes the
   * credential as a driver's licence.
   */
  subfileType: SubfileType | null;
  /** One-line summary for the toast — the reason on failure. */
  summary: string;
}

/**
 * Every field code any AAMVA version defines. Shape alone is not enough: `FOO`
 * matches the three-character pattern, so a shape-only check would load it into
 * the form as a value no schema renders and no payload carries — the opposite
 * of the documented promise that unknown keys are dropped.
 */
const KNOWN_FIELD_CODES: ReadonlySet<string> = new Set(
  Object.values(AAMVA_VERSIONS).flatMap((version) => version.fields.map((field) => field.code))
);

/** Longest paste worth parsing. A real payload is well under a kilobyte. */
const MAX_PASTE_LENGTH = 20_000;

/** Byte offsets of the first subfile directory entry's type marker. */
const DIRECTORY_TYPE_START = 21;
const DIRECTORY_TYPE_END = 23;

function fail(kind: PasteKind, summary: string): PasteImportResult {
  return { kind, data: null, fieldCount: 0, subfileType: null, summary };
}

/**
 * What the text looks like, without committing to parsing it. An AAMVA payload
 * is recognised by its compliance indicator, JSON by a leading brace.
 */
export function classifyPaste(text: string): PasteKind {
  const trimmed = text.trim();
  if (!trimmed) return "unknown";
  // The header is `@\n\x1e\rANSI ` — but a clipboard round trip through a text
  // editor often mangles the control bytes, so key off the parts that survive.
  if (trimmed.startsWith("@") || /^@?[\s\S]{0,8}ANSI\s?\d{6}/.test(trimmed)) return "aamva";
  if (trimmed.startsWith("{")) return "json";
  return "unknown";
}

/** The DL/ID marker in the payload's subfile directory, if it is legible. */
export function readSubfileType(payload: string): SubfileType | null {
  const marker = payload.substring(DIRECTORY_TYPE_START, DIRECTORY_TYPE_END);
  return marker === "DL" || marker === "ID" ? marker : null;
}

/** Keeps only known AAMVA codes plus the two control keys `loadJson` reads. */
function collectFields(source: Record<string, unknown>): {
  data: Record<string, string>;
  fieldCount: number;
} {
  const data: Record<string, string> = {};
  let fieldCount = 0;

  for (const [key, raw] of Object.entries(source)) {
    if (raw === null || raw === undefined) continue;
    if (typeof raw === "object") continue;
    const value = String(raw);

    if (key === "state") {
      if (AAMVA_STATES[value.toUpperCase()]) data.state = value.toUpperCase();
      continue;
    }
    if (key === "version") {
      // Exact keys only. The JSON branch is gated by `parseImportedPayload`,
      // which refuses an unsupported version outright; quietly padding "9" to
      // "09" here would make paste accept a shape the file picker rejects.
      if (AAMVA_VERSIONS[value]) data.version = value;
      continue;
    }
    if (!KNOWN_FIELD_CODES.has(key)) continue;
    data[key] = value;
    fieldCount++;
  }

  return { data, fieldCount };
}

/**
 * Parses pasted text into a loadable field map.
 *
 * Accepts a raw AAMVA payload string or a JSON object in the shape Export JSON
 * writes. Unknown keys are dropped rather than loaded, so pasting an unrelated
 * JSON blob can't stuff junk into the form.
 */
export function parsePastedPayload(text: string): PasteImportResult {
  const trimmed = text.trim();

  if (!trimmed) return fail("unknown", "Clipboard was empty.");
  if (trimmed.length > MAX_PASTE_LENGTH) {
    return fail("unknown", "That paste is too large to be an AAMVA payload.");
  }

  const kind = classifyPaste(trimmed);
  if (kind === "unknown") {
    return fail("unknown", "Clipboard doesn't look like an AAMVA payload or a JSON profile.");
  }

  if (kind === "json") {
    // The same guard the file picker and the drop overlay use, so a profile
    // naming a version this build has no field table for is refused here too
    // rather than silently loading into whatever schema is on screen.
    const parsed = parseImportedPayload(trimmed, "That paste");
    if (!parsed.ok) return fail(kind, parsed.error);
    const { data, fieldCount } = collectFields(parsed.data);
    if (fieldCount === 0) return fail(kind, "No AAMVA fields found in that paste.");
    return {
      kind,
      data,
      fieldCount,
      subfileType: null,
      summary: describe(fieldCount, data.state)
    };
  }

  // Only *leading* whitespace is stripped for the AAMVA branch — the payload's
  // final byte is its segment terminator, and trimming it makes the directory
  // length overrun the string.
  const payload = text.replace(/^\s+/, "");
  const decoded = decodePayload(payload);
  if (decoded.error || !decoded.data) {
    return fail(kind, decoded.error ?? "Could not read the pasted payload.");
  }

  const declaredVersion = decoded.data.version;
  if (typeof declaredVersion === "string" && !isSupportedVersion(declaredVersion)) {
    return fail(
      kind,
      `That paste is AAMVA version ${declaredVersion}, which this build does not support. ` +
        `Supported versions: ${AAMVA_VERSION_KEYS.join(", ")}.`
    );
  }

  const { data, fieldCount } = collectFields(decoded.data);
  if (fieldCount === 0) return fail(kind, "No AAMVA fields found in that paste.");

  return {
    kind,
    data,
    fieldCount,
    subfileType: readSubfileType(payload),
    summary: describe(fieldCount, data.state)
  };
}

function describe(fieldCount: number, state?: string): string {
  const where = state ? ` for ${state}` : "";
  return `Pasted ${fieldCount} field${fieldCount === 1 ? "" : "s"}${where}`;
}
