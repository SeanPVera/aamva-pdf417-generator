import { describe, expect, it } from "vitest";
import { generateKeyPairSync, sign, verify } from "node:crypto";
import { AAMVA_STATES } from "../core/states";
import {
  getFieldsForStateAndVersion,
  getFieldsForVersion,
  isSupportedVersion
} from "../core/schema";
import { generateAAMVAPayload } from "../core/generator";
import { decodeAAMVAFormat } from "../core/decoder";
import { buildSampleFill } from "../core/sampleFiller";
import {
  canonicalizeAamvaSignature,
  verifyAamvaSignature,
  signAamvaPayload
} from "../core/signature";
import {
  decodeSignatureAscii85,
  encodeSignatureAscii85,
  validateSignatureElements
} from "../core/signatureEncoding";
import { scanPayload } from "./support/scanOracle";
import { readDirectory } from "../core/decoder";
import ascii85References from "../core/conformance/signature-ascii85-reference.json";

function build(extra: Record<string, string> = {}, type: "DL" | "ID" = "DL") {
  const fields = getFieldsForStateAndVersion("CA", "12", type);
  return generateAAMVAPayload(
    "CA",
    "12",
    fields,
    { ...buildSampleFill(fields, "CA"), ...extra },
    { subfileType: type }
  );
}

// Test keys are generated locally and carry no issuer identity or certificate trust.
const keys = generateKeyPairSync("ec", { namedCurve: "prime256v1" });
async function publicKey() {
  return crypto.subtle.importKey(
    "spki",
    keys.publicKey.export({ type: "spki", format: "der" }),
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["verify"]
  );
}
function independentlySign(placeholder: string, canonical: string) {
  const bytes = sign("sha256", Buffer.from(canonical, "utf8"), {
    key: keys.privateKey,
    dsaEncoding: "ieee-p1363"
  });
  return placeholder.replace("SIG" + "0".repeat(80), () => "SIG" + encodeSignatureAscii85(bytes));
}

describe("CDS 2026 version 12 normative behavior (synthetic tests)", () => {
  it("exposes SIG/SCV only from v12", () => {
    expect(isSupportedVersion("12")).toBe(true);
    expect(getFieldsForVersion("12").map((f) => f.code)).toEqual(
      expect.arrayContaining(["SIG", "SCV"])
    );
    expect(getFieldsForVersion("11").some((f) => f.code === "SIG")).toBe(false);
  });
  it("includes every active optional element in the 2026 tables", () => {
    const codes = getFieldsForVersion("12").map((field) => field.code);
    expect(codes).toHaveLength(51);
    for (const code of [
      "DCI",
      "DCJ",
      "DCE",
      "DCM",
      "DCN",
      "DCO",
      "DCP",
      "DCQ",
      "DCR",
      "DAX",
      "DDH",
      "DDI",
      "DDJ"
    ])
      expect(codes).toContain(code);
    for (const code of ["DBN", "DBG", "DBS", "DCL", "DDC"]) expect(codes).not.toContain(code);
    expect(() => build({ DDK: "0" })).toThrow();
    expect(() => build({ DAW: "85" })).toThrow();
    expect(() => build({ DAU: "510" })).toThrow();
    expect(() => build({ DAD: "" })).toThrow(/Middle/);
    expect(() =>
      build({ DAZ: "BLONDE", DAX: "084", DDH: "02152008", DDM: "1", DDN: "1" })
    ).not.toThrow();
  });
  it("exposes the complete normative DL table without unverified historical issuer omissions", () => {
    const codes = getFieldsForVersion("12").map((field) => field.code);
    for (const state of Object.keys(AAMVA_STATES)) {
      expect(getFieldsForStateAndVersion(state, "12", "DL").map((field) => field.code)).toEqual(
        codes
      );
    }
  });
  for (const state of Object.keys(AAMVA_STATES)) {
    for (const type of ["DL", "ID"] as const) {
      it(`${state} ${type} can encode/decode an unsigned v12 test payload`, () => {
        const fields = getFieldsForStateAndVersion(state, "12", type);
        const sample = buildSampleFill(fields, state);
        const payload = generateAAMVAPayload(state, "12", fields, sample, { subfileType: type });
        expect(payload.slice(15, 17)).toBe("12");
        const decoded = decodeAAMVAFormat(payload);
        expect(decoded.error).toBeUndefined();
        expect(decoded.data?.subfileType).toBe(type);
        expect(decoded.data?.state).toBe(state);
        expect(decoded.data?.SIG).toBeUndefined();
      });
    }
  }
  it("keeps DL-only 2025/2026 indicators out of ID cards", () => {
    for (const version of ["11", "12"]) {
      const codes = getFieldsForStateAndVersion("CA", version, "ID").map((f) => f.code);
      for (const code of ["DCA", "DCB", "DCD", "DDM", "DDN", "DDP"])
        expect(codes).not.toContain(code);
      expect(codes).toContain("DDO");
    }
  });
  it("requires the commercial indicator for non-domiciled status", () => {
    expect(() => build({ DDN: "1" })).toThrow(/DDN requires/);
    expect(() => build({ DDM: "1", DDN: "1" })).not.toThrow();
  });
  it("retains signature case and rejects malformed ASCII85", () => {
    const signature = encodeSignatureAscii85(Uint8Array.from({ length: 64 }, (_, i) => i * 3));
    expect(decodeAAMVAFormat(build({ SIG: signature })).data?.SIG).toBe(signature);
    for (const invalid of [
      signature.slice(1),
      signature + "!",
      "z".repeat(80),
      "u".repeat(80),
      " ".repeat(80),
      "~".repeat(80)
    ]) {
      expect(() => build({ SIG: invalid })).toThrow();
    }
  });
  it("uses fixed-width raw signatures with no z compression", () => {
    expect(encodeSignatureAscii85(new Uint8Array(64))).toBe("!".repeat(80));
    const bytes = Uint8Array.from({ length: 64 }, (_, i) => 255 - i);
    expect(decodeSignatureAscii85(encodeSignatureAscii85(bytes))).toEqual(bytes);
    expect(() => encodeSignatureAscii85(new Uint8Array(70))).toThrow(/64 raw/);
  });
  it("matches independent Python ASCII85 reference bytes", () => {
    for (const reference of ascii85References.vectors) {
      const raw = Buffer.from(reference.rawHex, "hex");
      expect(encodeSignatureAscii85(raw)).toBe(reference.ascii85);
      expect(Buffer.from(decodeSignatureAscii85(reference.ascii85))).toEqual(raw);
    }
  });
  it("uses Latin-1 symbol bytes and UTF-8 signature input without directory drift", async () => {
    const placeholder = build({ DCS: "PEÑA", DAC: "JOSÉ", SIG: "0".repeat(80) });
    const payload = independentlySign(placeholder, placeholder);
    expect(Buffer.byteLength(payload, "latin1")).toBe(payload.length);
    expect(Buffer.byteLength(payload, "utf8")).toBeGreaterThan(payload.length);
    expect(readDirectory(payload, true).error).toBeUndefined();
    const scan = scanPayload(payload);
    expect(scan.ok, scan.ok ? "" : scan.error).toBe(true);
    if (scan.ok) expect(scan.text).toBe(payload);
    expect((await verifyAamvaSignature(payload, await publicKey())).signatureValid).toBe(true);
    expect(() => build({ DCS: "A\u0080B" })).toThrow(/encoding/);
    expect(() => build({ DCS: "李" })).toThrow(/encoding/);
  });
  it("requires complete and unambiguous coverage declarations", () => {
    expect(validateSignatureElements({ SCV: "SCV;" })).toMatch(/requires/);
    const base = { SIG: "0".repeat(80), SCV: "SIG,SCV,DAQ;DCF", DAQ: "123", DCF: "abc" };
    expect(validateSignatureElements(base)).toBeUndefined();
    for (const SCV of [
      "SIG,SCV;",
      "SIG,SCV,DAQ;DAQ,DCF",
      "SIG,SCV,DAQ,DAY;DCF",
      "SIG,DAQ;SCV,DCF",
      "SIG,SCV,DAQ;DCF;"
    ]) {
      expect(validateSignatureElements({ ...base, SCV })).toBeTruthy();
    }
    expect(() => build({ SCV: "SIG,SCV;" })).toThrow(/requires/);
  });
  it("verifies a Node-crypto signed whole payload with Web Crypto", async () => {
    const placeholder = build({ SIG: "0".repeat(80) });
    expect(canonicalizeAamvaSignature(placeholder)).toBe(placeholder);
    const payload = independentlySign(placeholder, placeholder);
    const verification = await verifyAamvaSignature(payload, await publicKey());
    expect(verification, verification.error).toMatchObject({
      status: "valid-signature",
      keyTrust: "caller-supplied"
    });
    expect(
      (await verifyAamvaSignature(payload.replace("DCSDOE", "DCSROE"), await publicKey()))
        .signatureValid
    ).toBe(false);
    const other = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, false, [
      "sign",
      "verify"
    ]);
    expect((await verifyAamvaSignature(payload, other.publicKey)).status).toBe("invalid-signature");
  });
  it("signs with a supplied private key and passes an independent Node crypto verification", async () => {
    const key = await crypto.subtle.importKey(
      "pkcs8",
      keys.privateKey.export({ type: "pkcs8", format: "der" }),
      { name: "ECDSA", namedCurve: "P-256" },
      false,
      ["sign"]
    );
    const placeholder = build({ SIG: "0".repeat(80) });
    const payload = await signAamvaPayload(placeholder, key);
    const signature = decodeSignatureAscii85(decodeAAMVAFormat(payload).data!.SIG!);
    expect(payload.length).toBe(placeholder.length);
    expect(
      verify(
        "sha256",
        Buffer.from(placeholder, "utf8"),
        { key: keys.publicKey, dsaEncoding: "ieee-p1363" },
        signature
      )
    ).toBe(true);
  });
  it("omits entire unsigned elements while preserving header, directory, and signed padding", async () => {
    const ordinary = decodeAAMVAFormat(build()).data!;
    const codes = Object.keys(ordinary).filter((code) => /^[A-Z]{2}[A-Z0-9]$/.test(code));
    const SCV = [...codes.filter((code) => code !== "DCF"), "SIG", "SCV"].join(",") + ";DCF";
    const placeholder = build({ SIG: "0".repeat(80), SCV });
    const canonical = placeholder.replace(/DCF[^\n\r]*\n/, "");
    expect(canonicalizeAamvaSignature(placeholder)).toBe(canonical);
    expect(canonical.slice(0, 31)).toBe(placeholder.slice(0, 31));
    const payload = independentlySign(placeholder, canonical);
    const key = await publicKey();
    expect((await verifyAamvaSignature(payload, key)).signatureValid).toBe(true);
    const discriminator = decodeAAMVAFormat(payload).data!.DCF!;
    expect(
      (
        await verifyAamvaSignature(
          payload.replace("DCF" + discriminator, "DCF" + "X".repeat(discriminator.length)),
          key
        )
      ).signatureValid
    ).toBe(true);
    expect(
      (await verifyAamvaSignature(payload.replace("DCSDOE", "DCSROE"), key)).signatureValid
    ).toBe(false);
  });
  it("covers signed padding across subfiles and omits a final unsigned CR-delimited element", async () => {
    const coverage = "DCS,SIG,SCV,ZAA;DCF,ZAB";
    const primary = `DLDCSPEÑA  \nDCFABC123\nSIG${"0".repeat(80)}\nSCV${coverage}\n\r`;
    const opaque = "ZAZAAabc \nZABunsigned\r";
    const header = "@\n\x1e\rANSI 636014120002";
    const directory = `DL0041${String(primary.length).padStart(4, "0")}ZA${String(41 + primary.length).padStart(4, "0")}${String(opaque.length).padStart(4, "0")}`;
    const placeholder = header + directory + primary + opaque;
    const canonical = header + directory + primary.replace("DCFABC123\n", "") + "ZAZAAabc \n";
    expect(canonicalizeAamvaSignature(placeholder)).toBe(canonical);
    const payload = independentlySign(placeholder, canonical);
    const key = await publicKey();
    expect((await verifyAamvaSignature(payload, key)).signatureValid).toBe(true);
    expect(
      (await verifyAamvaSignature(payload.replace("ZABunsigned", "ZABmodified"), key))
        .signatureValid
    ).toBe(true);
    expect(
      (await verifyAamvaSignature(payload.replace("ZAAabc ", "ZAAabc!"), key)).signatureValid
    ).toBe(false);
    expect(
      decodeAAMVAFormat(payload.replace("SCV" + coverage, "SCV" + coverage + ",DCS")).error
    ).toBeTruthy();
  });
  it("reports unsigned and unavailable verification without claiming authenticity", async () => {
    expect((await verifyAamvaSignature(build(), await publicKey())).status).toBe("unsigned");
    expect(
      (await verifyAamvaSignature(build({ SIG: "0".repeat(80) }), await publicKey(), null)).status
    ).toBe("verification-unavailable");
  });
});
