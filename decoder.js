/*
 * DECODER.JS — AAMVA STRUCTURED PAYLOAD DECODER
 * Converts the raw JSON payload (string) back into:
 *  - Parsed object
 *  - Pretty-printed output
 *  - Schema-aware field mapping
 *
 * Does NOT decode from bitmap barcode images — that requires
 * symbol detection and codeword extraction, which is outside
 * scope for this UI.
 *
 * MIT License
 */

window.AAMVA_DECODER = (() => {

  function decodePayload(text) {
    try {
      const obj = JSON.parse(text);
      if (!obj || typeof obj !== "object") {
        return { error: "Not valid JSON" };
      }
      return { data: obj };
    } catch {
      return { error: "Invalid JSON syntax" };
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
