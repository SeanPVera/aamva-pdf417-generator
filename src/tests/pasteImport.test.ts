import { describe, it, expect } from "vitest";
import { classifyPaste, parsePastedPayload } from "../core/pasteImport";
import { generateAAMVAPayload } from "../core/generator";
import { getFieldsForStateAndVersion } from "../core/schema";

const CA_FIELDS = {
  DCS: "DOE",
  DAC: "JANE",
  DBD: "01012024",
  DBB: "01011990",
  DBA: "01012028",
  DBC: "2",
  DAY: "BRO",
  DAU: "067 IN",
  DAG: "123 MAIN ST",
  DAI: "ANYTOWN",
  DAJ: "CA",
  DAK: "90001",
  DAQ: "A1234567",
  DCF: "ABCDEFG12345",
  DCG: "USA",
  DCA: "C",
  DCB: "NONE",
  DCD: "NONE",
  DDE: "N",
  DDF: "N",
  DDG: "N",
  DDB: "01012024"
};

function caPayload(): string {
  return generateAAMVAPayload(
    "CA",
    "10",
    getFieldsForStateAndVersion("CA", "10"),
    { ...CA_FIELDS },
    { subfileType: "DL" }
  );
}

describe("classifyPaste", () => {
  it("recognises a raw AAMVA payload", () => {
    expect(classifyPaste(caPayload())).toBe("aamva");
  });

  it("recognises a payload whose control bytes were mangled by a text editor", () => {
    expect(classifyPaste("ANSI 636014100002DL00410279DLDCSDOE")).toBe("aamva");
  });

  it("recognises a JSON profile", () => {
    expect(classifyPaste('{"state":"CA","DCS":"DOE"}')).toBe("json");
  });

  it("calls everything else unknown", () => {
    expect(classifyPaste("")).toBe("unknown");
    expect(classifyPaste("   ")).toBe("unknown");
    expect(classifyPaste("https://example.com")).toBe("unknown");
    expect(classifyPaste("[1,2,3]")).toBe("unknown");
  });
});

describe("parsePastedPayload", () => {
  it("round-trips a generated payload back into field values", () => {
    const result = parsePastedPayload(caPayload());
    expect(result.kind).toBe("aamva");
    expect(result.data).not.toBeNull();
    expect(result.data!.DCS).toBe("DOE");
    expect(result.data!.DAQ).toBe("A1234567");
    // The IIN identifies the jurisdiction, so the paste carries it with them.
    expect(result.data!.state).toBe("CA");
    expect(result.data!.version).toBe("10");
    expect(result.fieldCount).toBeGreaterThan(15);
    expect(result.summary).toContain("for CA");
  });

  it("loads a JSON profile in the shape Export JSON writes", () => {
    const result = parsePastedPayload(
      JSON.stringify({ state: "TX", version: "09", DCS: "SMITH", DAC: "JOHN" })
    );
    expect(result.kind).toBe("json");
    expect(result.data).toEqual({ state: "TX", version: "09", DCS: "SMITH", DAC: "JOHN" });
    expect(result.fieldCount).toBe(2);
  });

  // Pasting an unrelated JSON blob must not stuff junk into the form.
  it("drops keys that are not AAMVA field codes", () => {
    const result = parsePastedPayload(
      JSON.stringify({ DCS: "DOE", password: "hunter2", nested: { DAC: "X" }, dcs: "lower" })
    );
    expect(result.data).toEqual({ DCS: "DOE" });
    expect(result.fieldCount).toBe(1);
  });

  it("ignores an unknown jurisdiction or version rather than loading it", () => {
    const result = parsePastedPayload(JSON.stringify({ state: "ZZ", version: "99", DCS: "DOE" }));
    expect(result.data).toEqual({ DCS: "DOE" });
  });

  it("normalizes a single-digit version and a lower-case state", () => {
    const result = parsePastedPayload(JSON.stringify({ state: "ca", version: "9", DCS: "DOE" }));
    expect(result.data!.state).toBe("CA");
    expect(result.data!.version).toBe("09");
  });

  it("explains itself when the paste carries no fields", () => {
    const result = parsePastedPayload(JSON.stringify({ hello: "world" }));
    expect(result.data).toBeNull();
    expect(result.summary).toMatch(/no aamva fields/i);
  });

  it("explains itself when the text is not a payload", () => {
    const result = parsePastedPayload("just some notes I copied");
    expect(result.kind).toBe("unknown");
    expect(result.data).toBeNull();
    expect(result.summary).toMatch(/doesn't look like/i);
  });

  it("reports a broken AAMVA payload instead of silently doing nothing", () => {
    const result = parsePastedPayload("@\n\x1e\rANSI 636014");
    expect(result.kind).toBe("aamva");
    expect(result.data).toBeNull();
    expect(result.summary.length).toBeGreaterThan(0);
  });

  it("refuses an oversized paste", () => {
    const result = parsePastedPayload("@" + "x".repeat(20_001));
    expect(result.data).toBeNull();
    expect(result.summary).toMatch(/too large/i);
  });

  it("handles an empty clipboard", () => {
    expect(parsePastedPayload("").summary).toMatch(/empty/i);
  });
});
