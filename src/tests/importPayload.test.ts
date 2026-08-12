import { describe, it, expect } from "vitest";
import { parseImportedPayload } from "../core/importPayload";

/**
 * Every import path funnels through this. The header file picker and the
 * drag-and-drop overlay each used to carry their own copy of the parse and
 * shape checks, so a guard added to one left the other accepting files the
 * first one rejected.
 */
describe("parseImportedPayload", () => {
  it("accepts a payload object", () => {
    const result = parseImportedPayload('{"state":"CA","version":"10","DCS":"DOE"}');
    expect(result).toEqual({
      ok: true,
      data: { state: "CA", version: "10", DCS: "DOE" }
    });
  });

  it("accepts a payload with no version at all", () => {
    expect(parseImportedPayload('{"DCS":"DOE"}').ok).toBe(true);
  });

  it("rejects a version this build has no field table for", () => {
    const result = parseImportedPayload('{"version":"99"}', "card.json");
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("unreachable");
    expect(result.error).toContain("card.json");
    expect(result.error).toContain("version 99");
    expect(result.error).toContain("01, 02, 03, 04, 05, 06, 07, 08, 09, 10");
  });

  it("accepts every version the app defines", () => {
    for (const version of ["01", "04", "05", "06", "07", "10"]) {
      expect(parseImportedPayload(`{"version":"${version}"}`).ok, `v${version}`).toBe(true);
    }
  });

  it("rejects an array", () => {
    const result = parseImportedPayload("[1,2,3]");
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("unreachable");
    expect(result.error).toMatch(/single payload object/);
  });

  it("rejects a bare scalar and null", () => {
    expect(parseImportedPayload("42").ok).toBe(false);
    expect(parseImportedPayload("null").ok).toBe(false);
    expect(parseImportedPayload('"text"').ok).toBe(false);
  });

  it("rejects malformed JSON with a distinct message", () => {
    const result = parseImportedPayload("{not json");
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("unreachable");
    expect(result.error).toMatch(/Failed to parse JSON file/);
  });

  it("ignores a non-string version rather than crashing", () => {
    // A hand-edited file could carry `"version": 10`. It is not a version token
    // we can act on, but it is not a reason to refuse the file either.
    expect(parseImportedPayload('{"version":10}').ok).toBe(true);
  });
});
