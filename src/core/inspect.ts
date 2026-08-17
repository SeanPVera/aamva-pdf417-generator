/**
 * Byte-level accounting for a decoded AAMVA payload.
 *
 * The decoder's job is to recover field values; this module's job is to say
 * where every byte of the payload went. Those are different questions, and the
 * second one only became interesting once real cards turned up.
 *
 * A decoded New York credential declares a 323-byte DL subfile whose visible
 * elements accounted for 224 — and there was no way to tell, from a field dump,
 * whether the missing 99 bytes were fixed-width padding the dump had trimmed or
 * elements its table did not recognise. Both are invisible in a list of
 * name/value pairs and both are obvious in a byte ledger. This produces the
 * ledger: what each subfile declared, what its elements actually consume, what
 * is left over, and which values arrived space-filled.
 */
import { AAMVA_VERSIONS } from "./schema";
import { AAMVA_STATES } from "./states";
import { readDirectory, RE_FIELD_CODE, type SubfileEntry } from "./decoder";

export interface InspectedElement {
  code: string;
  /** Which subfile carried it (e.g. "DL", "ZN"). */
  subfile: string;
  /** The value exactly as it sits on the wire, fixed-width padding included. */
  raw: string;
  /** The value after the decoder strips padding — what the form would load. */
  value: string;
  /** Trailing bytes the encoder space-filled. Zero for a value written as-is. */
  padding: number;
  /** False when this version's field table has no entry for the code. */
  known: boolean;
}

export interface InspectedSubfile {
  type: string;
  /** Offset and length as the header directory declares them. */
  declaredOffset: number;
  declaredLength: number;
  /** Bytes actually available to read, after any drift repair. */
  actualLength: number;
  /** True when the declared offset or length did not survive verification. */
  repaired: boolean;
  elementCount: number;
  /** Bytes the subfile framing and its parsed elements account for. */
  accountedBytes: number;
  /**
   * Declared bytes no element explains. Non-zero means the payload holds
   * something this build cannot name — the single most useful number here.
   */
  unaccountedBytes: number;
  /** The segments that did not parse as an element, for eyeballing. */
  unparsed: string[];
}

export interface PayloadInspection {
  iin: string;
  /** Jurisdiction resolved from the IIN, when it is one we know. */
  state?: string;
  version: string;
  jurisdictionVersion: string;
  declaredEntries: number;
  totalBytes: number;
  subfiles: InspectedSubfile[];
  elements: InspectedElement[];
  /** Codes whose values arrived space-filled to a fixed width. */
  paddedCodes: string[];
  /** Codes this build's field table does not define. */
  unknownCodes: string[];
  /** Sum of `unaccountedBytes` across every subfile. */
  totalUnaccounted: number;
}

export interface InspectionResult {
  ok: boolean;
  error?: string;
  inspection?: PayloadInspection;
}

const _IIN_TO_STATE = new Map<string, string>(
  Object.entries(AAMVA_STATES).map(([code, def]) => [def.IIN, code])
);

/**
 * Walks one subfile, accounting for every byte between its start and its end.
 *
 * Elements are separator-terminated, so the walk is a scan for the separator
 * rather than a split — a split discards where each segment sat, and position
 * is the whole point of a ledger.
 */
function inspectSubfile(
  payload: string,
  entry: SubfileEntry,
  knownCodes: ReadonlySet<string>
): { subfile: InspectedSubfile; elements: InspectedElement[] } {
  const elements: InspectedElement[] = [];
  const unparsed: string[] = [];
  const body = payload.substring(entry.start + 2, entry.end);

  let accounted = 2; // the subfile type bytes
  let cursor = 0;

  while (cursor < body.length) {
    const nextSeparator = body.indexOf("\n", cursor);
    const isLast = nextSeparator === -1;
    const segment = body.substring(cursor, isLast ? body.length : nextSeparator);
    cursor = isLast ? body.length : nextSeparator + 1;

    // The tail is usually just the segment terminator — but not always. New
    // York terminates the last element of a subfile with the CR alone, no
    // separator before it, so the tail is a whole element. Reading it as
    // leftovers cost exactly one element per subfile: 5 bytes for the DL
    // subfile's DDD, 94 for the ZN subfile's ZNB, which is how this was found.
    const terminated = isLast ? segment.replace(/\r$/, "") : segment;
    if (isLast && terminated === "") {
      accounted += segment.length;
      break;
    }

    const code = terminated.substring(0, 3);
    if (terminated.length < 3 || !RE_FIELD_CODE.test(code)) {
      unparsed.push(segment);
      if (isLast) break;
      continue;
    }

    const raw = terminated.substring(3);
    const value = raw.replace(/ +$/, "");
    elements.push({
      code,
      subfile: entry.type,
      raw,
      value,
      padding: raw.length - value.length,
      known: knownCodes.has(code)
    });
    // The trailing byte is the separator mid-subfile and the terminator at the
    // end; either way it belongs to this element's span.
    accounted += segment.length + (isLast ? 0 : 1);
    if (isLast) break;
  }

  return {
    subfile: {
      type: entry.type,
      declaredOffset: entry.declaredOffset,
      declaredLength: entry.declaredLength,
      actualLength: entry.end - entry.start,
      repaired: entry.repaired,
      elementCount: elements.length,
      accountedBytes: accounted,
      unaccountedBytes: entry.declaredLength - accounted,
      unparsed
    },
    elements
  };
}

/**
 * Produces a byte ledger for an AAMVA payload string.
 *
 * Deliberately separate from `decodeAAMVAFormat`: decoding answers "what does
 * this card say", inspection answers "what is in these bytes", and conflating
 * them would put diagnostic detail in the path every scan takes.
 */
export function inspectPayload(text: string): InspectionResult {
  if (!text || typeof text !== "string") return { ok: false, error: "Empty or invalid input" };
  if (text.charAt(0) !== "@") return { ok: false, error: "Not an AAMVA payload" };
  if (text.length < 21) return { ok: false, error: "Payload too short for an AAMVA header" };

  // Read with the overrun cap lifted: a subfile that declares far more than it
  // holds is precisely what this reports on, so the read has to survive it.
  const { entries, error } = readDirectory(text, false, Number.MAX_SAFE_INTEGER);
  if (error) return { ok: false, error };

  const version = text.substring(15, 17);
  // An unknown version has no field table, so nothing can be called known —
  // which is itself worth showing rather than treating as "all unrecognised".
  const knownCodes = new Set((AAMVA_VERSIONS[version]?.fields ?? []).map((f) => f.code));

  const subfiles: InspectedSubfile[] = [];
  const elements: InspectedElement[] = [];
  for (const entry of entries) {
    const result = inspectSubfile(text, entry, knownCodes);
    subfiles.push(result.subfile);
    elements.push(...result.elements);
  }

  const iin = text.substring(9, 15);
  return {
    ok: true,
    inspection: {
      iin,
      state: _IIN_TO_STATE.get(iin),
      version,
      jurisdictionVersion: text.substring(17, 19),
      declaredEntries: parseInt(text.substring(19, 21), 10),
      totalBytes: text.length,
      subfiles,
      elements,
      paddedCodes: elements.filter((e) => e.padding > 0).map((e) => e.code),
      // Jurisdiction subfile elements are excluded: AAMVA reserves Z* to the
      // issuer and defines nothing inside, so "not in the field table" is their
      // normal condition rather than a finding.
      unknownCodes: elements.filter((e) => !e.known && !e.code.startsWith("Z")).map((e) => e.code),
      totalUnaccounted: subfiles.reduce((sum, s) => sum + s.unaccountedBytes, 0)
    }
  };
}

/** The ledger as plain text, for copying into a bug report or a spec question. */
export function formatInspection(inspection: PayloadInspection): string {
  const lines: string[] = [
    `IIN ${inspection.iin}${inspection.state ? ` (${inspection.state})` : ""} — ` +
      `AAMVA v${inspection.version}, jurisdiction version ${inspection.jurisdictionVersion}`,
    `${inspection.declaredEntries} directory entr${inspection.declaredEntries === 1 ? "y" : "ies"}, ` +
      `${inspection.totalBytes} bytes total`,
    ""
  ];

  for (const s of inspection.subfiles) {
    lines.push(
      `${s.type}  offset ${s.declaredOffset}  declared ${s.declaredLength}B  ` +
        `${s.elementCount} element${s.elementCount === 1 ? "" : "s"} accounting for ${s.accountedBytes}B` +
        (s.unaccountedBytes === 0 ? "  ✓ balanced" : `  ⚠ ${s.unaccountedBytes}B unaccounted`) +
        (s.repaired ? "  (offset repaired)" : "")
    );
    for (const segment of s.unparsed) {
      lines.push(`      unparsed: ${JSON.stringify(segment)}`);
    }
  }

  const padded = inspection.elements.filter((e) => e.padding > 0);
  if (padded.length > 0) {
    lines.push("", "Space-filled on the wire:");
    for (const e of padded) {
      lines.push(`  ${e.code}  "${e.value}" + ${e.padding} space${e.padding === 1 ? "" : "s"}`);
    }
  }

  if (inspection.unknownCodes.length > 0) {
    lines.push("", `Not in the v${inspection.version} field table:`);
    for (const e of inspection.elements.filter((x) => !x.known && !x.code.startsWith("Z"))) {
      lines.push(`  ${e.code}  "${e.value}"`);
    }
  }

  return lines.join("\n");
}

/**
 * A one-line verdict, or null when the payload balances.
 *
 * Names the two explanations that a field dump cannot tell apart, because
 * knowing which one you are looking at is the entire reason to run this.
 */
export function summarizeAnomalies(inspection: PayloadInspection): string | null {
  const findings: string[] = [];

  if (inspection.totalUnaccounted !== 0) {
    findings.push(
      `${Math.abs(inspection.totalUnaccounted)} byte${Math.abs(inspection.totalUnaccounted) === 1 ? "" : "s"} ` +
        `${inspection.totalUnaccounted > 0 ? "declared but unaccounted for" : "beyond the declared length"}`
    );
  }
  if (inspection.paddedCodes.length > 0) {
    findings.push(`${inspection.paddedCodes.length} space-filled value(s)`);
  }
  if (inspection.unknownCodes.length > 0) {
    findings.push(`${inspection.unknownCodes.length} element(s) outside the field table`);
  }
  if (inspection.subfiles.some((s) => s.repaired)) {
    findings.push("a directory offset that needed repair");
  }

  return findings.length > 0 ? findings.join(", ") : null;
}
