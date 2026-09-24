import { beforeEach, describe, expect, it } from "vitest";
import { decodePayload, decodeAAMVAFormat, validateAAMVAPayloadStructure } from "../core/decoder";
import { generateAAMVAPayload } from "../core/generator";
import { parseImportedPayload } from "../core/importPayload";
import { parsePastedPayload } from "../core/pasteImport";
import { getFieldsForStateAndVersion } from "../core/schema";
import { getValidationIssues, validateFieldValue } from "../core/validation";
import { computeExportLayout } from "../core/barcodeDimensions";
import { parseBatchTable } from "../core/csv";
import { useFormStore } from "../hooks/useFormStore";
import ca from "../core/conformance/vectors/ca-v10-dl-baseline.json";
import ny from "../core/conformance/vectors/ny-v10-dl-issued.json";

function wire(body: string, gap = "") {
  return (
    "@\n\x1e\rANSI 636014100001DL" +
    String(31 + gap.length).padStart(4, "0") +
    String(body.length).padStart(4, "0") +
    gap +
    body
  );
}

describe("adversarial parser boundaries", () => {
  it("requires a complete DL segment terminator, including after length drift", () => {
    const full = wire("DLDCSExample\n\r");
    expect(decodeAAMVAFormat(full).data?.DCS).toBe("Example");
    expect(decodeAAMVAFormat(full.slice(0, -1)).error).toMatch(/terminator|truncated/i);
  });

  it("strict framing accounts for bytes before the first subfile", () => {
    expect(validateAAMVAPayloadStructure(wire("DLDCSExample\r", "XYZ"), true).ok).toBe(false);
  });

  it("refuses conflicting duplicate fields rather than silently selecting the last identity", () => {
    expect(decodeAAMVAFormat(wire("DLDCSFIRST\nDCSSECOND\r")).error).toMatch(/duplicate/i);
  });

  it("refuses malformed element lines instead of quietly dropping them", () => {
    expect(decodeAAMVAFormat(wire("DLDCSExample\n??broken\r")).error).toMatch(/element/i);
  });

  it("rejects strings that cannot represent single-byte input", () => {
    expect(decodeAAMVAFormat(wire("DLDCS猫\r")).error).toMatch(/byte|encoding/i);
  });

  it("keeps jurisdiction elements when pasting an issued-layout synthetic record", () => {
    const parsed = parsePastedPayload(ny.expectedBytes);
    expect(parsed.data?.ZNB).toBe(ny.input.ZNB);
    expect(parsed.data?.ZNA).toBe(ny.expectedBytes.split("ZNA")[1]?.split(/[\r\n]/)[0]);
  });

  it.each([
    '{"state":"ZZ","DCS":"EXAMPLE"}',
    '{"version":10,"DCS":"EXAMPLE"}',
    '{"DCS":{"nested":"EXAMPLE"}}',
    '{"DCS":123}',
    '{"subfileType":"XX","DCS":"EXAMPLE"}'
  ])("rejects malformed JSON profile %s", (text) => {
    expect(parseImportedPayload(text).ok).toBe(false);
  });

  it("does not parse arbitrarily large JSON inputs", () => {
    expect(parseImportedPayload(JSON.stringify({ DCS: "X".repeat(1_100_000) })).ok).toBe(false);
  });

  it("applies JSON shape validation to scanner decoding as well as file import", () => {
    expect(decodePayload('{"state":"CA","version":"10","DAQ":123}').error).toMatch(/text/);
    expect(decodePayload('{"state":"CA","version":"10","subfileType":"XX"}').error).toMatch(
      /DL or ID/
    );
  });

  it("preserves opaque CSV bytes and rejects text after a closing quote", () => {
    expect(parseBatchTable("ZNB\r\naBc  ").rows[0]?.ZNB).toBe("aBc  ");
    expect(() => parseBatchTable('DCS\n"DOE"SMITH')).toThrow(/quote/i);
    expect(() => parseBatchTable('DCS\nDO"E')).toThrow(/quote/i);
  });

  it("preserves the ID document type through JSON paste", () => {
    expect(
      parsePastedPayload('{"state":"CA","version":"10","subfileType":"ID","DCS":"EXAMPLE"}')
        .subfileType
    ).toBe("ID");
  });

  it("rejects ambiguous CSV instead of discarding columns or merging records", () => {
    expect(() => parseBatchTable("DCS,DCS\nFIRST,SECOND")).toThrow(/duplicate/i);
    expect(() => parseBatchTable('DCS,DAC\n"UNFINISHED,VALUE')).toThrow(/quote/i);
    expect(() => parseBatchTable("DCS,DAC\nONE,TWO,THREE")).toThrow(/column/i);
  });
});

describe("record semantics and export bounds", () => {
  const schema = getFieldsForStateAndVersion("CA", "10");
  it("preserves an address jurisdiction that differs from the issuer", () => {
    const payload = generateAAMVAPayload("CA", "10", schema, { ...ca.input, DAJ: "NV" });
    expect(decodeAAMVAFormat(payload).data?.DAJ).toBe("NV");
  });

  it.each(["EX\nAMPLE", "EX猫AMPLE", "EX\u0000AMPLE"])(
    "never silently deletes identity characters: %s",
    (DCS) => {
      expect(() => generateAAMVAPayload("CA", "10", schema, { ...ca.input, DCS })).toThrow(
        /character|ASCII|encoding/i
      );
    }
  );

  it("treats whitespace-only required values as missing in the UI", () => {
    const field = schema.find((f) => f.code === "DCS")!;
    expect(validateFieldValue(field, "   ", "CA")).toBe(false);
    expect(getValidationIssues([field], { DCS: "   " }, "CA", false)[0]?.kind).toBe("empty");
  });

  it("refuses a clipped print layout and non-finite sizes", () => {
    expect(() => computeExportLayout(1000, 500, 900, 300)).toThrow(/fit|small/i);
    expect(() => computeExportLayout(NaN, 50, 900, 300)).toThrow();
  });
});

describe("atomic document history", () => {
  beforeEach(() => {
    useFormStore.setState({
      state: "CA",
      version: "10",
      subfileType: "DL",
      fields: { DCS: "BEFORE" },
      sourcePayload: "source before",
      _history: [],
      _future: [],
      _lastEditCode: "",
      _lastEditAt: 0
    });
  });

  it("undo restores jurisdiction, version, type, fields, and source together", () => {
    useFormStore
      .getState()
      .loadJson({ state: "NY", version: "09", subfileType: "ID", DCS: "AFTER" }, "source after");
    useFormStore.getState().undo();
    expect(useFormStore.getState()).toMatchObject({
      state: "CA",
      version: "10",
      subfileType: "DL",
      fields: { DCS: "BEFORE" },
      sourcePayload: "source before"
    });
    useFormStore.getState().redo();
    expect(useFormStore.getState()).toMatchObject({
      state: "NY",
      version: "09",
      subfileType: "ID",
      fields: { DCS: "AFTER" },
      sourcePayload: "source after"
    });
  });

  it("clear removes sensitive history as well as the active record", () => {
    useFormStore.getState().setField("DCS", "AFTER");
    useFormStore.getState().clearFields();
    expect(useFormStore.getState()._history).toEqual([]);
    expect(useFormStore.getState()._future).toEqual([]);
    expect(useFormStore.getState().sourcePayload).toBeNull();
    useFormStore.getState().undo();
    expect(useFormStore.getState().fields).toEqual({});
  });

  it("rejects invalid configuration before mutating the document", () => {
    expect(() => useFormStore.getState().loadJson({ state: "INVALID", DCS: "AFTER" })).toThrow();
    expect(useFormStore.getState().fields.DCS).toBe("BEFORE");
  });
});

describe("verified DL and ID differences", () => {
  it.each(["10", "11"])("does not require driving privileges on a v%s ID record", (version) => {
    const fields = getFieldsForStateAndVersion("CA", version);
    const data = { ...ca.input, DBB: "01012020", DBD: "01012024", DBA: "01012029" } as Record<
      string,
      string
    >;
    delete data.DCA;
    delete data.DCB;
    delete data.DCD;
    const payload = generateAAMVAPayload("CA", version, fields, data, { subfileType: "ID" });
    expect(decodeAAMVAFormat(payload).data?.subfileType).toBe("ID");
    expect(payload).not.toContain("DCA");
  });
});

import { parseBatchInput } from "../core/batchInput";
import { toSafeReportCsv } from "../core/csv";
import { secureGetRandomInt } from "../core/crypto";
import { createZip } from "../core/zip";

describe("secondary input and export boundaries", () => {
  it.each(["[null]", "[[]]", '["text"]', '[{"DAQ":123}]'])(
    "rejects unsafe batch preview %s",
    (text) => {
      expect(() => parseBatchInput(text)).toThrow(/row|text/i);
    }
  );
  it("limits batch rows before rendering or encoding", () => {
    expect(() =>
      parseBatchInput(JSON.stringify(Array.from({ length: 1001 }, () => ({ DCS: "EXAMPLE" }))))
    ).toThrow(/1000/);
  });
  it("quotes spreadsheet formulas in reports without changing record CSV", () => {
    expect(toSafeReportCsv(["state", "error"], [{ state: "=1+1", error: "@SUM(A1)" }])).toBe(
      "state,error\r\n'=1+1,'@SUM(A1)"
    );
  });
  it.each([NaN, Infinity, 1.5])(
    "refuses an invalid random bound %s without a rejection loop",
    (bound) => {
      expect(() => secureGetRandomInt(bound)).toThrow(/integer/);
    }
  );
  it("marks UTF-8 ZIP names explicitly", () => {
    const zip = createZip([{ name: "résumé.png", data: new Uint8Array([1]) }]);
    expect(new DataView(zip.buffer).getUint16(6, true)).toBe(0x0800);
  });
  it("preserves unknown elements on import for explicit inspection", () => {
    expect(parsePastedPayload('{"state":"CA","FOO":"opaque","DCS":"EXAMPLE"}').data?.FOO).toBe(
      "opaque"
    );
  });
  it("preserves significant trailing bytes in opaque jurisdiction elements", () => {
    const body = "DLDCSExample\r";
    const z = "ZNZNBopaque  \r";
    const payload =
      "@\n\x1e\rANSI 636014100002DL0041" +
      String(body.length).padStart(4, "0") +
      "ZN" +
      String(41 + body.length).padStart(4, "0") +
      String(z.length).padStart(4, "0") +
      body +
      z;
    expect(decodeAAMVAFormat(payload).data?.ZNB).toBe("opaque  ");
  });
});
