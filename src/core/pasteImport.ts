// Turns arbitrary clipboard text into something the form can load.
//
// The app could already take a payload three ways — a file picker, a drag-drop,
// and a webcam scan — but not the way people actually move a payload around,
// which is copying the string out of a scanner app, a bug report, or a test
// fixture and hitting paste. This classifies whatever landed on the clipboard
// and returns a field map, or an honest reason why it can't.

import { decodePayload } from "./decoder";
import { AAMVA_STATES } from "./states";
import { AAMVA_VERSIONS } from "./schema";

export type PasteKind = "aamva" | "json" | "unknown";

export interface PasteImportResult {
  kind: PasteKind;
  /** Field map ready for `loadJson`, or null when nothing usable was found. */
  data: Record<string, string> | null;
  /** How many AAMVA field codes the paste carried. */
  fieldCount: number;
  /** One-line summary for the toast — the reason on failure. */
  summary: string;
}

const FIELD_CODE = /^[A-Z]{2}[A-Z0-9]$/;

/** Longest paste worth parsing. A real payload is well under a kilobyte. */
const MAX_PASTE_LENGTH = 20_000;

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

/** Keeps only recognised AAMVA codes plus the two control keys `loadJson` reads. */
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
      const padded = value.padStart(2, "0");
      if (AAMVA_VERSIONS[padded]) data.version = padded;
      continue;
    }
    if (!FIELD_CODE.test(key)) continue;
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

  if (!trimmed) {
    return { kind: "unknown", data: null, fieldCount: 0, summary: "Clipboard was empty." };
  }
  if (trimmed.length > MAX_PASTE_LENGTH) {
    return {
      kind: "unknown",
      data: null,
      fieldCount: 0,
      summary: "That paste is too large to be an AAMVA payload."
    };
  }

  const kind = classifyPaste(trimmed);
  if (kind === "unknown") {
    return {
      kind,
      data: null,
      fieldCount: 0,
      summary: "Clipboard doesn't look like an AAMVA payload or a JSON profile."
    };
  }

  // decodePayload handles both branches: `@`-prefixed goes through the AAMVA
  // reader, anything else through JSON.parse. Only *leading* whitespace is
  // stripped for the AAMVA branch — the payload's final byte is its segment
  // terminator, and trimming it makes the directory length overrun the string.
  const decoded = decodePayload(kind === "aamva" ? text.replace(/^\s+/, "") : trimmed);
  if (decoded.error || !decoded.data) {
    return {
      kind,
      data: null,
      fieldCount: 0,
      summary: decoded.error ?? "Could not read the pasted payload."
    };
  }

  const { data, fieldCount } = collectFields(decoded.data);
  if (fieldCount === 0) {
    return {
      kind,
      data: null,
      fieldCount: 0,
      summary: "No AAMVA fields found in that paste."
    };
  }

  const where = data.state ? ` for ${data.state}` : "";
  return {
    kind,
    data,
    fieldCount,
    summary: `Pasted ${fieldCount} field${fieldCount === 1 ? "" : "s"}${where}`
  };
}
