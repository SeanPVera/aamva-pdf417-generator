/** AAMVA CDS 2026 B.6.2 and Annex D: raw P-256 signatures, not ASN.1 DER. */
export function decodeSignatureAscii85(value: string): Uint8Array<ArrayBuffer> {
  if (value.length !== 80 || /[^!-u]/.test(value)) {
    throw new Error(
      "SIG must contain exactly 80 ASCII85 characters, without whitespace or z substitution"
    );
  }
  const bytes = new Uint8Array(64);
  for (let offset = 0; offset < 80; offset += 5) {
    let word = 0;
    for (let i = 0; i < 5; i++) word = word * 85 + value.charCodeAt(offset + i) - 33;
    if (word > 0xffffffff) throw new Error("SIG contains an overflowing ASCII85 group");
    const index = (offset / 5) * 4;
    bytes[index] = Math.floor(word / 0x1000000);
    bytes[index + 1] = Math.floor(word / 0x10000) & 255;
    bytes[index + 2] = Math.floor(word / 0x100) & 255;
    bytes[index + 3] = word & 255;
  }
  return bytes;
}

export function encodeSignatureAscii85(bytes: Uint8Array): string {
  if (bytes.length !== 64) throw new Error("A P-256 signature must contain 64 raw r||s bytes");
  let encoded = "";
  for (let offset = 0; offset < 64; offset += 4) {
    let word =
      bytes[offset]! * 0x1000000 +
      bytes[offset + 1]! * 0x10000 +
      bytes[offset + 2]! * 256 +
      bytes[offset + 3]!;
    const group = new Array<string>(5);
    for (let index = 4; index >= 0; index--) {
      group[index] = String.fromCharCode((word % 85) + 33);
      word = Math.floor(word / 85);
    }
    encoded += group.join("");
  }
  return encoded;
}

export interface SignatureCoverage {
  signed: string[];
  unsigned: string[];
}

export function parseSignatureCoverage(value: string): SignatureCoverage {
  const lists = value.split(";");
  if (lists.length !== 2)
    throw new Error("SCV must contain signed and unsigned lists separated by one semicolon");
  const parse = (list: string): string[] => {
    if (list === "") return [];
    const codes = list.split(",");
    if (codes.some((code) => !/^[A-Z]{2}[A-Z0-9]$/.test(code)))
      throw new Error("SCV lists must contain three-character element IDs");
    return codes;
  };
  const signed = parse(lists[0]!);
  const unsigned = parse(lists[1]!);
  if (new Set([...signed, ...unsigned]).size !== signed.length + unsigned.length)
    throw new Error("SCV repeats an element ID");
  return { signed, unsigned };
}

/** Returns a diagnostic without normalizing or changing the supplied data. */
export function validateSignatureElements(elements: Record<string, string>): string | undefined {
  const hasSignature = Object.prototype.hasOwnProperty.call(elements, "SIG");
  const hasCoverage = Object.prototype.hasOwnProperty.call(elements, "SCV");
  if (hasCoverage && !hasSignature) return "SCV requires a SIG element";
  if (!hasSignature) return undefined;
  try {
    decodeSignatureAscii85(elements.SIG!);
    if (!hasCoverage) return undefined;
    const { signed, unsigned } = parseSignatureCoverage(elements.SCV!);
    if (!signed.includes("SCV") || !signed.includes("SIG"))
      return "SCV must declare SCV and SIG as signed";
    const declared = new Set([...signed, ...unsigned]);
    const present = Object.keys(elements).filter((code) => /^[A-Z]{2}[A-Z0-9]$/.test(code));
    const missing = present.filter((code) => !declared.has(code));
    const absent = [...declared].filter((code) => !present.includes(code));
    if (missing.length) return `SCV omits present elements: ${missing.join(", ")}`;
    if (absent.length) return `SCV names absent elements: ${absent.join(", ")}`;
    return undefined;
  } catch (error) {
    return (error as Error).message;
  }
}
