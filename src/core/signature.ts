import { readDirectory, validateAAMVAPayloadStructure } from "./decoder";
import {
  decodeSignatureAscii85,
  encodeSignatureAscii85,
  parseSignatureCoverage,
  validateSignatureElements
} from "./signatureEncoding";
import { isPrintableWireValue } from "./wireEncoding";

interface WireElement {
  code: string;
  value: string;
  start: number;
  end: number;
}

/** Strict raw-wire parsing keeps signed padding, delimiters and directory bytes intact. */
function signedWireElements(payload: string): WireElement[] {
  const structure = validateAAMVAPayloadStructure(payload, true);
  if (!structure.ok) throw new Error(structure.error);
  if (payload.slice(15, 17) !== "12")
    throw new Error("Standard SIG verification requires AAMVA version 12");
  const { entries, error } = readDirectory(payload, true);
  if (error) throw new Error(error);
  const elements: WireElement[] = [];
  const seen = new Set<string>();
  for (const subfile of entries) {
    let cursor = subfile.start + 2;
    while (cursor < subfile.end) {
      if (payload[cursor] === "\r" && cursor === subfile.end - 1) break;
      let end = cursor;
      while (end < subfile.end && payload[end] !== "\n" && payload[end] !== "\r") end++;
      const code = payload.slice(cursor, cursor + 3);
      if (end - cursor < 3 || !/^[A-Z]{2}[A-Z0-9]$/.test(code))
        throw new Error("Malformed signed data element");
      if (seen.has(code)) throw new Error(`Duplicate signed data element ${code}`);
      seen.add(code);
      const value = payload.slice(cursor + 3, end);
      if (!isPrintableWireValue(value, true))
        throw new Error(`Unsupported character in signed element ${code}`);
      if (end >= subfile.end) throw new Error("Signed element lacks a delimiter");
      elements.push({ code, value, start: cursor, end: end + 1 });
      cursor = end + 1;
    }
  }
  return elements;
}

export function canonicalizeAamvaSignature(payload: string): string {
  const elements = signedWireElements(payload);
  const values = Object.fromEntries(elements.map((element) => [element.code, element.value]));
  const diagnostic = validateSignatureElements(values);
  if (diagnostic) throw new Error(diagnostic);
  if (!Object.prototype.hasOwnProperty.call(values, "SIG"))
    throw new Error("No SIG element is present");
  const unsigned = new Set(values.SCV ? parseSignatureCoverage(values.SCV).unsigned : []);
  let canonical = "";
  let cursor = 0;
  for (const element of elements) {
    canonical += payload.slice(cursor, element.start);
    if (!unsigned.has(element.code)) {
      canonical +=
        element.code === "SIG"
          ? "SIG" + "0".repeat(80) + payload.slice(element.end - 1, element.end)
          : payload.slice(element.start, element.end);
    }
    cursor = element.end;
  }
  return canonical + payload.slice(cursor);
}

export interface SignatureVerification {
  status:
    | "unsigned"
    | "malformed"
    | "valid-signature"
    | "invalid-signature"
    | "verification-unavailable";
  signatureValid: boolean;
  /** This API checks a supplied key; issuer certificate trust is the caller's responsibility. */
  keyTrust: "caller-supplied";
  error?: string;
}

export async function verifyAamvaSignature(
  payload: string,
  publicKey: CryptoKey,
  subtle: SubtleCrypto | null | undefined = globalThis.crypto?.subtle
): Promise<SignatureVerification> {
  const result = (
    status: SignatureVerification["status"],
    error?: string
  ): SignatureVerification => ({
    status,
    signatureValid: status === "valid-signature",
    keyTrust: "caller-supplied",
    ...(error ? { error } : {})
  });
  let elements: WireElement[];
  let canonical: string;
  try {
    elements = signedWireElements(payload);
    if (!elements.some((element) => element.code === "SIG")) {
      if (elements.some((element) => element.code === "SCV"))
        return result("malformed", "SCV requires SIG");
      return result("unsigned");
    }
    canonical = canonicalizeAamvaSignature(payload);
  } catch (error) {
    return result("malformed", (error as Error).message);
  }
  if (!subtle) return result("verification-unavailable", "Web Crypto is unavailable");
  if (
    publicKey.type !== "public" ||
    publicKey.algorithm.name !== "ECDSA" ||
    (publicKey.algorithm as EcKeyAlgorithm).namedCurve !== "P-256"
  )
    return result("malformed", "Verification requires a public ECDSA P-256 key");
  try {
    const signature = decodeSignatureAscii85(
      elements.find((element) => element.code === "SIG")!.value
    );
    const valid = await subtle.verify(
      { name: "ECDSA", hash: "SHA-256" },
      publicKey,
      // The typed view is a portable BufferSource. Node 20 rejects an
      // ArrayBuffer from another realm, including the DOM test environment.
      signature,
      new TextEncoder().encode(canonical)
    );
    return result(valid ? "valid-signature" : "invalid-signature");
  } catch (error) {
    return result("verification-unavailable", (error as Error).message);
  }
}

/** Signs with a caller-owned key. This API does not create issuer credentials or trust. */
export async function signAamvaPayload(
  payload: string,
  privateKey: CryptoKey,
  subtle: SubtleCrypto = globalThis.crypto.subtle
): Promise<string> {
  if (
    privateKey.type !== "private" ||
    privateKey.algorithm.name !== "ECDSA" ||
    (privateKey.algorithm as EcKeyAlgorithm).namedCurve !== "P-256"
  )
    throw new Error("Signing requires a private ECDSA P-256 key");
  const canonical = canonicalizeAamvaSignature(payload);
  const signature = new Uint8Array(
    await subtle.sign(
      { name: "ECDSA", hash: "SHA-256" },
      privateKey,
      new TextEncoder().encode(canonical)
    )
  );
  const element = signedWireElements(payload).find((element) => element.code === "SIG")!;
  return (
    payload.slice(0, element.start + 3) +
    encodeSignatureAscii85(signature) +
    payload.slice(element.end - 1)
  );
}
