import { describe, it, expect } from "vitest";
import { detectDelimiter, splitDelimited, parseBatchTable, toCsv } from "../core/csv";

describe("csv", () => {
  describe("detectDelimiter", () => {
    it("picks tab for TSV", () => {
      expect(detectDelimiter("state\tversion\tDCS\nCA\t10\tDOE")).toBe("\t");
    });

    it("picks comma for CSV", () => {
      expect(detectDelimiter("state,version,DCS\nCA,10,DOE")).toBe(",");
    });

    it("picks semicolon when it dominates", () => {
      expect(detectDelimiter("state;version;DCS\nCA;10;DOE")).toBe(";");
    });
  });

  describe("splitDelimited", () => {
    it("splits plain rows", () => {
      expect(splitDelimited("a,b\n1,2", ",")).toEqual([
        ["a", "b"],
        ["1", "2"]
      ]);
    });

    it("honours quoted fields containing the delimiter", () => {
      expect(splitDelimited('a,b\n"DOE, JANE",2', ",")).toEqual([
        ["a", "b"],
        ["DOE, JANE", "2"]
      ]);
    });

    it("unescapes doubled quotes", () => {
      expect(splitDelimited('a\n"say ""hi"""', ",")).toEqual([["a"], ['say "hi"']]);
    });

    it("handles CRLF line endings and a trailing newline", () => {
      expect(splitDelimited("a,b\r\n1,2\r\n", ",")).toEqual([
        ["a", "b"],
        ["1", "2"]
      ]);
    });

    it("keeps newlines that appear inside quotes", () => {
      expect(splitDelimited('a\n"line1\nline2"', ",")).toEqual([["a"], ["line1\nline2"]]);
    });
  });

  describe("parseBatchTable", () => {
    it("upper-cases field codes and preserves control columns", () => {
      const table = parseBatchTable("state,version,dcs,dac\nCA,10,DOE,JANE");
      expect(table.headers).toEqual(["state", "version", "DCS", "DAC"]);
      expect(table.rows).toEqual([{ state: "CA", version: "10", DCS: "DOE", DAC: "JANE" }]);
      expect(table.unknownHeaders).toEqual([]);
    });

    it("matches control columns case-insensitively", () => {
      const table = parseBatchTable("State,Version,SubfileType\nCA,10,ID");
      expect(table.headers).toEqual(["state", "version", "subfileType"]);
      expect(table.rows[0]).toEqual({ state: "CA", version: "10", subfileType: "ID" });
    });

    it("reports headers that are neither field codes nor control columns", () => {
      const table = parseBatchTable("state,version,notes\nCA,10,hello");
      expect(table.unknownHeaders).toEqual(["NOTES"]);
    });

    it("omits empty cells rather than storing empty strings", () => {
      const table = parseBatchTable("state,version,DCS\nCA,10,");
      expect(table.rows[0]).toEqual({ state: "CA", version: "10" });
    });

    it("returns an empty result for empty input", () => {
      expect(parseBatchTable("")).toEqual({ headers: [], rows: [], unknownHeaders: [] });
    });

    it("parses TSV without being told the delimiter", () => {
      const table = parseBatchTable("state\tversion\tDCS\nTX\t10\tROE");
      expect(table.rows[0]).toEqual({ state: "TX", version: "10", DCS: "ROE" });
    });
  });

  describe("toCsv", () => {
    it("writes a header row and quotes only what needs it", () => {
      const csv = toCsv(
        ["row", "error"],
        [
          { row: 1, error: "plain" },
          { row: 2, error: "has, comma" }
        ]
      );
      expect(csv).toBe('row,error\r\n1,plain\r\n2,"has, comma"');
    });

    it("escapes embedded quotes", () => {
      expect(toCsv(["a"], [{ a: 'say "hi"' }])).toBe('a\r\n"say ""hi"""');
    });

    it("renders missing keys as empty cells", () => {
      expect(toCsv(["a", "b"], [{ a: "1" }])).toBe("a,b\r\n1,");
    });
  });
});
