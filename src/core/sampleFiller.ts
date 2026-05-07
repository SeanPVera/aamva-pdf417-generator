import type { AAMVAField } from "./schema";

/** A small, deterministic-feel set of values that pass strict validation
 *  for nearly every state. Used by the dev-only "Fill sample" action. */
export const SAMPLE_FILL_VALUES: Record<string, string> = {
  DAA: "DOE,JANE,Q",
  DCS: "DOE",
  DAC: "JANE",
  DAD: "Q",
  DCT: "JANE Q",
  DCU: "",
  DBB: "02151990", // MMDDYYYY (v04+); v01-03 also accept 8 digits
  DBC: "2",
  DBA: "01012029",
  DBD: "01012024",
  DDB: "01012020",
  DAY: "BRO",
  DAZ: "BRO",
  DCL: "",
  DAU: "067 IN",
  DAW: "150",
  DAX: "",
  DAG: "123 SAMPLE ST",
  DAH: "",
  DAI: "SAN FRANCISCO",
  DAJ: "CA",
  DAK: "94110",
  DAQ: "D1234567",
  DCA: "C",
  DCB: "NONE",
  DCD: "NONE",
  DAR: "C",
  DAS: "NONE",
  DAT: "NONE",
  DCF: "SAMPLEDD12345",
  DCG: "USA",
  DDE: "N",
  DDF: "N",
  DDG: "N",
  DDA: "F",
  DDK: "0",
  DDL: "0"
};

/**
 * Builds a sample-fill record limited to the fields present in the schema.
 * Skips fields where we don't have a sample value (so the user keeps any
 * existing input they had for those).
 */
export function buildSampleFill(schemaFields: AAMVAField[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const field of schemaFields) {
    const value = SAMPLE_FILL_VALUES[field.code];
    if (value !== undefined && value !== "") out[field.code] = value;
  }
  return out;
}
