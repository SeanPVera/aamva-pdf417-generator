import { AAMVA_STATES } from "./states";
import { AAMVA_VERSIONS } from "./schema";
import { parseImportedPayload } from "./importPayload";
import { validateSignatureElements } from "./signatureEncoding";
import { isPrintableWireValue } from "./wireEncoding";

// Pre-built IIN → state-code Map for O(1) lookup during decoding.
// Replaces an O(n) linear scan through all 54 jurisdictions on every decode.
const _IIN_TO_STATE = new Map<string, string>(
  Object.entries(AAMVA_STATES).map(([code, def]) => [def.IIN, code])
);

// Hoisted regex for AAMVA data element identifier validation (e.g. "DCS", "DAQ").
// Exported so the byte-ledger in `inspect.ts` splits elements from non-elements
// by exactly the rule the decoder uses, rather than a second copy of it.
export const RE_FIELD_CODE = /^[A-Z]{2}[A-Z0-9]$/;

// Hoisted regex patterns used in structural validation.
const RE_6_DIGITS = /^\d{6}$/;
const RE_2_DIGITS = /^\d{2}$/;
const RE_4_DIGITS = /^\d{4}$/;
const RE_SUBFILE_TYPE = /^[A-Z0-9]{2}$/;

/** Bytes of directory drift a non-strict read will absorb. See `readDirectory`. */
const SUBFILE_OFFSET_TOLERANCE = 4;

/** Modern headers use 21 bytes; v01 can use 19. Directory entries use 10. */
const DIRECTORY_ENTRY_LENGTH = 10;

export interface PayloadHeader {
  /** Absolute position of @ in the supplied, unchanged text. */
  start: number;
  headerLength: 19 | 21;
  version: string;
  jurisdictionVersion: string;
  count: number;
  diagnostics: string[];
}

/** The v01 layout has no jurisdiction-version token. Never infer it for later editions. */
export function readPayloadHeader(payload: string, strict = false): PayloadHeader {
  const start = !strict && payload.startsWith(" @\n") ? 1 : 0;
  const version = payload.slice(start + 15, start + 17);
  const legacy = version === "01" && /^(DL|ID)/.test(payload.slice(start + 19, start + 21));
  const headerLength = legacy ? 19 : 21;
  const countToken = payload.slice(start + headerLength - 2, start + headerLength);
  const diagnostics: string[] = [];
  if (start)
    diagnostics.push(
      "One leading space precedes the compliance indicator; directory offsets are relative to @."
    );
  if (legacy) diagnostics.push("Legacy v01 header omits the jurisdiction-version token.");
  if (payload[start + 2] === "\x1c")
    diagnostics.push("Nonstandard 0x1c record separator retained from source.");
  return {
    start,
    headerLength,
    version,
    jurisdictionVersion: legacy ? "" : payload.slice(start + 17, start + 19),
    count: RE_2_DIGITS.test(countToken) ? Number(countToken) : NaN,
    diagnostics
  };
}

export interface ValidationResult {
  ok: boolean;
  error?: string;
}

export interface SubfileEntry {
  /** Two-character designator from the directory (e.g. "DL", "ZC"). */
  type: string;
  /** Offset and length exactly as the directory declares them. */
  declaredOffset: number;
  declaredLength: number;
  /** Where the subfile's bytes actually start and end in this payload. */
  start: number;
  end: number;
  /** True when the declared offset/length did not survive verification as-is. */
  repaired: boolean;
}

export interface DirectoryRead {
  entries: SubfileEntry[];
  error?: string;
}

/**
 * Resolves every directory entry against the payload's actual bytes.
 *
 * Real encoders miscount. A Connecticut credential decoded for this project
 * declares its DL subfile one byte longer than the bytes it contains, which
 * pushes the declared offset of the following `ZC` subfile one byte past where
 * `ZC` actually begins — the two subfiles are individually well-formed and the
 * total length is right, only the boundary between them is off. A reader that
 * trusts the arithmetic blindly rejects that card; a reader that ignores the
 * directory entirely cannot tell subfiles apart. So each entry is verified
 * against the type bytes at its declared offset and nudged onto the marker when
 * it just misses, within a few bytes.
 *
 * `strict` disables the nudge: the generator self-checks with it, and its own
 * output has no excuse for being off by anything.
 *
 * `maxLengthOverrun` is how far a declared length may exceed the bytes present
 * before the read gives up. The default is the same few bytes of drift the
 * offsets get. The byte-ledger in `inspect.ts` raises it, because a length that
 * overruns badly is the anomaly it exists to measure — refusing to read the one
 * payload class it was written for would make it useless.
 */
export function readDirectory(
  payload: string,
  strict: boolean,
  maxLengthOverrun: number = SUBFILE_OFFSET_TOLERANCE
): DirectoryRead {
  const header = readPayloadHeader(payload, strict);
  if (!Number.isFinite(header.count)) {
    return { entries: [], error: "Invalid directory entry count" };
  }
  const numEntries = header.count;
  const directoryEnd = header.start + header.headerLength + numEntries * DIRECTORY_ENTRY_LENGTH;
  const entries: SubfileEntry[] = [];

  for (let i = 0; i < numEntries; i++) {
    const base = header.start + header.headerLength + i * DIRECTORY_ENTRY_LENGTH;
    const type = payload.substring(base, base + 2);
    const offsetToken = payload.substring(base + 2, base + 6);
    const lengthToken = payload.substring(base + 6, base + 10);

    if (i === 0 && type !== "DL" && type !== "ID") {
      return { entries, error: "First directory entry must be DL or ID" };
    }
    if (!RE_SUBFILE_TYPE.test(type)) {
      return { entries, error: `Invalid subfile type in directory entry ${i + 1}` };
    }
    if (!RE_4_DIGITS.test(offsetToken) || !RE_4_DIGITS.test(lengthToken)) {
      return { entries, error: "Invalid directory offset/length" };
    }

    const declaredOffset = parseInt(offsetToken, 10);
    const declaredLength = parseInt(lengthToken, 10);

    if (declaredOffset + header.start < directoryEnd)
      return { entries, error: "Offset points inside directory" };
    if (declaredLength < 3) return { entries, error: "Subfile length is too short" };

    let start = declaredOffset + header.start;
    let repaired = false;

    if (payload.substring(start, start + 2) !== type) {
      const nudged = strict ? -1 : findNearby(payload, type, start, directoryEnd);
      if (nudged === -1) {
        return { entries, error: markerError(payload, start, i) };
      }
      start = nudged;
      repaired = true;
    }

    let end = start + declaredLength;
    if (end > payload.length) {
      // Absorb the same few bytes of slop the offset check does — an encoder
      // that overstates a length by one is the case this exists for. A length
      // that overruns by more than that is not drift, it is a corrupt or
      // truncated payload, and calling it readable would hide the damage.
      if (strict || end - payload.length > maxLengthOverrun) {
        return { entries, error: "Subfile length exceeds payload size" };
      }
      end = payload.length;
      repaired = true;
    }

    entries.push({ type, declaredOffset, declaredLength, start, end, repaired });
  }

  if (strict && entries[0]?.start !== directoryEnd) {
    return { entries, error: "Unaccounted bytes before first subfile" };
  }

  if (strict) {
    // Our own encoder lays subfiles end to end with nothing between them and
    // nothing after the last, so anything else in strict mode is our bug. The
    // per-entry checks above cannot see this: a length that overruns into the
    // *next* subfile still fits inside the payload.
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i]!;
      const boundary = entries[i + 1]?.start ?? payload.length;
      if (entry.end !== boundary) {
        return {
          entries,
          error:
            entry.end > boundary
              ? `Subfile ${entry.type} overlaps the next subfile`
              : `Unaccounted bytes after subfile ${entry.type}`
        };
      }
    }
  }

  // A repaired boundary can leave the previous subfile overlapping this one.
  // Trim rather than drop: the elements themselves are intact, and reading a
  // subfile's bytes twice would duplicate them into the decoded record.
  for (let i = 0; i < entries.length - 1; i++) {
    const current = entries[i];
    const next = entries[i + 1];
    if (current && next && current.end > next.start) {
      if (next.start <= current.start || current.end - next.start > SUBFILE_OFFSET_TOLERANCE) {
        return { entries, error: "Overlapping or unordered subfile directory" };
      }
      current.end = next.start;
      current.repaired = true;
    }
  }

  // The published SC v01 sample understates its final subfile by two bytes.
  // Keep that legacy tolerance visible; strict reads still use declared bounds.
  if (!strict && header.headerLength === 19) {
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i]!;
      const boundary = entries[i + 1]?.start ?? payload.length;
      if (
        entry.end < boundary &&
        boundary - entry.end <= SUBFILE_OFFSET_TOLERANCE &&
        payload[boundary - 1] === "\r"
      ) {
        entry.end = boundary;
        entry.repaired = true;
      }
    }
  }

  return { entries };
}

/**
 * Why a subfile marker did not check out, phrased for the thing that is wrong.
 *
 * The first entry has two distinct failures worth telling apart: bytes that are
 * not a DL/ID subfile at all, versus a legitimate DL/ID subfile the directory
 * mislabels. They point at different bugs in whatever produced the payload.
 */
function markerError(payload: string, offset: number, index: number): string {
  if (index !== 0)
    return `Subfile marker for entry ${index + 1} does not match directory entry type`;
  const marker = payload.substring(offset, offset + 2);
  return marker === "DL" || marker === "ID"
    ? "Subfile marker does not match directory entry type"
    : "Subfile marker at offset must be DL or ID";
}

/** Nearest index within tolerance where `type` actually appears, or -1. */
function findNearby(payload: string, type: string, offset: number, floor: number): number {
  for (let delta = 1; delta <= SUBFILE_OFFSET_TOLERANCE; delta++) {
    for (const candidate of [offset - delta, offset + delta]) {
      if (candidate < floor || candidate + 2 > payload.length) continue;
      if (payload.substring(candidate, candidate + 2) === type) return candidate;
    }
  }
  return -1;
}

export function validateAAMVAPayloadStructure(
  payload: string,
  strictMode = false
): ValidationResult {
  if (!payload || typeof payload !== "string")
    return { ok: false, error: "Empty or invalid payload" };
  if (payload.length < 29)
    return { ok: false, error: "Payload too short for AAMVA header and directory" };
  if (payload.length > 100_000) return { ok: false, error: "Payload exceeds parser size limit" };
  // eslint-disable-next-line no-control-regex -- validate the single-byte wire boundary
  if (/[^\u0000-\u00ff]/.test(payload)) {
    return { ok: false, error: "Unsupported input encoding: expected a single-byte payload" };
  }

  const header = readPayloadHeader(payload, strictMode);
  const start = header.start;
  if (payload.charAt(start) !== "@") return { ok: false, error: "Invalid compliance indicator" };
  if (payload.charAt(start + 1) !== "\n")
    return { ok: false, error: "Invalid data element separator" };
  const legacySCSeparator =
    !strictMode &&
    header.headerLength === 19 &&
    payload.slice(start + 9, start + 15) === "636005" &&
    payload[start + 2] === "\x1c";
  if (payload.charAt(start + 2) !== "\x1e" && !legacySCSeparator)
    return { ok: false, error: "Invalid record separator" };
  if (payload.charAt(start + 3) !== "\r") return { ok: false, error: "Invalid segment terminator" };
  if (payload.substring(start + 4, start + 9) !== "ANSI ")
    return { ok: false, error: "Invalid file type" };
  if (!RE_6_DIGITS.test(payload.substring(start + 9, start + 15)))
    return { ok: false, error: "Invalid IIN" };
  if (!RE_2_DIGITS.test(header.version)) return { ok: false, error: "Invalid AAMVA version token" };
  if (header.headerLength === 21 && !RE_2_DIGITS.test(header.jurisdictionVersion))
    return { ok: false, error: "Invalid jurisdiction version token" };

  if (!Number.isFinite(header.count)) return { ok: false, error: "Invalid directory entry count" };

  const numEntries = header.count;
  if (numEntries < 1)
    return { ok: false, error: "AAMVA payload must contain at least one subfile entry" };

  const directoryEnd = start + header.headerLength + numEntries * DIRECTORY_ENTRY_LENGTH;
  if (payload.length < directoryEnd)
    return { ok: false, error: "Payload truncated before directory entries" };

  // Every entry is checked, not just the first. A jurisdiction subfile is a
  // real part of the format — Connecticut ships one — and a directory that
  // declares two entries while only the first is well-formed is not a payload
  // this app should call valid.
  const { entries, error } = readDirectory(payload, strictMode);
  if (error) return { ok: false, error };
  for (const entry of entries) {
    if (strictMode && payload.slice(entry.start + 2, entry.end - 1).includes("\r"))
      return { ok: false, error: `Interior segment terminator in ${entry.type}` };
    if ((entry.type === "DL" || entry.type === "ID") && payload[entry.end - 1] !== "\r") {
      return {
        ok: false,
        error: `Missing segment terminator in ${entry.type}; payload may be truncated`
      };
    }
  }

  return { ok: true };
}

export interface DecodeResult {
  error?: string;
  data?: Record<string, string>;
  ok?: boolean;
  json?: Record<string, string>;
  mapped?: string;
  /** Subfile designators found in the directory, in order (e.g. ["DL", "ZC"]). */
  subfiles?: string[];
  /** Compatibility observations; the input text is never rewritten. */
  diagnostics?: string[];
}

export function decodePayload(text: string): DecodeResult {
  if (!text || typeof text !== "string") return { error: "Empty or invalid input" };

  if (text.charAt(0) === "@" || text.startsWith(" @\n")) return decodeAAMVAFormat(text);

  const parsed = parseImportedPayload(text, "This barcode");
  return parsed.ok ? { data: parsed.data } : { error: parsed.error };
}

export function decodeAAMVAFormat(text: string): DecodeResult {
  try {
    const strictValidation = validateAAMVAPayloadStructure(text);
    if (!strictValidation.ok) return { error: strictValidation.error };

    const header = readPayloadHeader(text);
    const iin = text.substring(header.start + 9, header.start + 15);
    const version = header.version;

    const { entries: subfiles, error } = readDirectory(text, false);
    if (error) return { error };
    if (subfiles.length === 0) return { error: "No DL or ID subfile found in directory" };

    const obj: Record<string, string> = { version: version };
    const diagnostics = [...header.diagnostics];

    // Every subfile is read, not only the first. A jurisdiction's Z* elements
    // were previously dropped on the floor: the values reached the decoder and
    // it walked past them, so scanning a Connecticut barcode and re-encoding it
    // silently lost the ZC subfile.
    for (const subfile of subfiles) {
      const fieldData = text.substring(subfile.start + 2, subfile.end);
      for (let entry of fieldData.split("\n")) {
        if (!entry || entry === "\r") continue;
        if (
          version !== "12" &&
          subfile.type.startsWith("Z") &&
          entry.startsWith("\r") &&
          RE_FIELD_CODE.test(entry.slice(1, 4))
        ) {
          entry = entry.slice(1);
          diagnostics.push(
            `Interior segment terminator precedes ${entry.slice(0, 3)} in ${subfile.type}; source framing is nonstandard.`
          );
        }
        if (entry.length < 3 || !RE_FIELD_CODE.test(entry.substring(0, 3))) {
          return { error: `Malformed data element in ${subfile.type}` };
        }
        const code = entry.substring(0, 3);
        let value = entry.substring(3);
        // Strip the segment terminator and any fixed-width space padding the
        // encoder added (AAMVA space-fills DAK to 11 characters, for example).
        // The padding is an encoding artefact, never data — leaving it on the
        // decoded value made the postal code fail re-validation, so a scanned
        // or imported barcode could not be regenerated.
        value = value.replace(/\r$/, "");
        if (!subfile.type.startsWith("Z") && !(version === "12" && ["SIG", "SCV"].includes(code)))
          value = value.replace(/ +$/, "");
        if (RE_FIELD_CODE.test(code)) {
          if (
            Object.prototype.hasOwnProperty.call(obj, code) &&
            (obj[code] !== value || version === "12")
          ) {
            return { error: `Conflicting duplicate element ${code}; inspect the original payload` };
          }
          // Interior control characters are not a continuation of the value.
          // eslint-disable-next-line no-control-regex
          if (/[\x00-\x1f\x7f]/.test(value))
            return { error: `Unexpected control character in element ${code}` };
          if (version === "12" && !isPrintableWireValue(value, true))
            return { error: `Unsupported ISO-8859-1 value in element ${code}` };
          obj[code] = value;
        }
      }
    }

    if (version === "12") {
      const diagnostic = validateSignatureElements(obj);
      if (diagnostic) return { error: diagnostic };
    }

    const stateCode = _IIN_TO_STATE.get(iin);
    if (stateCode) obj.state = stateCode;
    obj.subfileType = subfiles[0]!.type;

    if (subfiles.some((subfile) => subfile.repaired))
      diagnostics.push("Directory boundary drift was tolerated; inspect the original bytes.");
    if (
      subfiles[0]!.start !==
        header.start + header.headerLength + header.count * DIRECTORY_ENTRY_LENGTH ||
      subfiles[subfiles.length - 1]!.end !== text.length
    )
      diagnostics.push(
        "Bytes outside the declared subfile ranges remain unaccounted; inspect the original payload."
      );
    return {
      data: obj,
      subfiles: subfiles.map((s) => s.type),
      ...(diagnostics.length ? { diagnostics } : {})
    };
  } catch (err) {
    return { error: "Failed to parse AAMVA payload: " + (err as Error).message };
  }
}

export function describeFields(obj: Record<string, string>): string {
  if (!obj.version || !AAMVA_VERSIONS[obj.version]) {
    return "Unknown version — cannot map fields.\n" + JSON.stringify(obj, null, 2);
  }

  const def = AAMVA_VERSIONS[obj.version];
  if (!def) return "Unknown version — cannot map fields.\n" + JSON.stringify(obj, null, 2);
  const lines = [`AAMVA ${def.name}`, ""];

  def.fields.forEach((f) => {
    const val = obj[f.code] ?? "";
    lines.push(`${f.code}: ${val}   (${f.label})`);
  });

  // Codes the version table does not define — jurisdiction subfile elements
  // above all. Listing them is the whole point of decoding them: they are the
  // part of a real card that no published field table will explain.
  const known = new Set(def.fields.map((f) => f.code));
  const extra = Object.keys(obj).filter(
    (code) => !["version", "state", "subfileType"].includes(code) && !known.has(code)
  );
  if (extra.length > 0) {
    lines.push("", "Jurisdiction-defined / unrecognized elements:");
    for (const code of extra) {
      lines.push(`${code}: ${obj[code]}`);
    }
  }

  return lines.join("\n");
}

export function decodeAAMVA(text: string): DecodeResult {
  const base = decodePayload(text);
  if (base.error) return { error: base.error };

  const obj = base.data!;
  return {
    ok: true,
    json: obj,
    mapped: describeFields(obj),
    subfiles: base.subfiles,
    ...(base.diagnostics ? { diagnostics: base.diagnostics } : {})
  };
}
