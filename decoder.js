/*
 * DECODER.JS — AAMVA STRUCTURED PAYLOAD DECODER
 * Parses AAMVA-formatted barcode payload strings back into:
 *  - Parsed object with field code/value pairs
 *  - Pretty-printed output
 *  - Schema-aware field mapping
 *
 * Supports the AAMVA data format (header + DL subfile with
 * data element separators) as produced by generateAAMVAPayload.
 *
 * Does NOT decode from bitmap barcode images — that requires
 * symbol detection and codeword extraction, which is outside
 * scope for this UI.
 *
 * MIT License
 */

window.AAMVA_DECODER = (() => {

  function decodePayload(text) {
    if (!text || typeof text !== "string") {
      return { error: "Empty or invalid input" };
    }

    // Try AAMVA format first (starts with @ compliance indicator)
    if (text.charAt(0) === "@") {
      return decodeAAMVAFormat(text);
    }

    // Fall back to JSON for backward compatibility
    try {
      const obj = JSON.parse(text);
      if (!obj || typeof obj !== "object") {
        return { error: "Not a valid payload" };
      }
      return { data: obj };
    } catch {
      return { error: "Unrecognized payload format" };
    }
  }

  function decodeAAMVAFormat(text) {
    try {
      // Header structure:
      // @(1) + \n(1) + \x1e(1) + \r(1) + "ANSI "(5) + IIN(6) + version(2) + jurisVersion(2) + numEntries(2)
      // Offsets: IIN starts at 9, version at 15, jurisVersion at 17, numEntries at 19
      // = 21 bytes of header before subfile directory entries
      const iin = text.substring(9, 15);
      const version = text.substring(15, 17);
      const numEntries = Number.parseInt(text.substring(19, 21), 10);

      if (!Number.isInteger(numEntries) || numEntries < 1) {
        return { error: "Invalid AAMVA directory entry count" };
      }

      // Parse subfile directory entries to find DL offset/length.
      let dlOffset = null;
      let dlLength = null;
      for (let i = 0; i < numEntries; i++) {
        const entryStart = 21 + (i * 10);
        const type = text.substring(entryStart, entryStart + 2);
        const offset = Number.parseInt(text.substring(entryStart + 2, entryStart + 6), 10);
        const length = Number.parseInt(text.substring(entryStart + 6, entryStart + 10), 10);

        if (type === "DL") {
          dlOffset = offset;
          dlLength = length;
          break;
        }
      }

      if (dlOffset === null || dlLength === null) {
        return { error: "No DL subfile found" };
      }

      if (!Number.isInteger(dlOffset) || !Number.isInteger(dlLength) || dlOffset < 0 || dlLength <= 0) {
        return { error: "Invalid DL directory metadata" };
      }

      // DL subfile contains the "DL" designator at its beginning.
      const dlSubfile = text.substring(dlOffset, dlOffset + dlLength);
      if (!dlSubfile.startsWith("DL")) {
        return { error: "DL subfile offset mismatch" };
      }

      // Extract only the DL payload content after "DL".
      const subfileContent = dlSubfile.substring(2);

      // Parse field code/value pairs separated by \n (data element separator)
      const obj = { version: version };
      const entries = subfileContent.split("\n");

      for (const entry of entries) {
        // Each entry is a 3-character field code followed by the value
        if (entry.length >= 3) {
          const code = entry.substring(0, 3);
          let value = entry.substring(3);
          // Strip trailing segment terminator
          value = value.replace(/\r$/, "");
          if (code.match(/^[A-Z]{2}[A-Z0-9]$/)) {
            obj[code] = value;
          }
        }
      }

      // Resolve state from IIN
      if (window.AAMVA_STATES) {
        for (const [stateCode, stateDef] of Object.entries(window.AAMVA_STATES)) {
          if (stateDef && stateDef.IIN === iin) {
            obj.state = stateCode;
            break;
          }
        }
      }

      return { data: obj };
    } catch (err) {
      return { error: "Failed to parse AAMVA payload: " + err.message };
    }
  }

  function describeFields(obj) {
    if (!obj.version || !window.AAMVA_VERSIONS[obj.version]) {
      return "Unknown version — cannot map fields.\n" +
             JSON.stringify(obj, null, 2);
    }

    const def = window.AAMVA_VERSIONS[obj.version];
    const lines = [];
    lines.push(`AAMVA ${def.name}`);
    lines.push("");

    def.fields.forEach(f => {
      const val = obj[f.code] ?? "";
      lines.push(`${f.code}: ${val}   (${f.label})`);
    });

    return lines.join("\n");
  }

  return {
    decode(text) {
      const base = decodePayload(text);
      if (base.error) return { error: base.error };

      const obj = base.data;
      return {
        ok: true,
        json: obj,
        mapped: describeFields(obj)
      };
    }
  };
})();
