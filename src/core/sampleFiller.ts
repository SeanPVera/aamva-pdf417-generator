import type { AAMVAField } from "./schema";
import { AAMVA_STATE_RULES } from "./validation";
import { getEffectiveDateRules } from "./jurisdictionRules";

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

const SAMPLE_ISSUE_DATE = SAMPLE_FILL_VALUES.DBD!; // MMDDYYYY

/** Shifts an MMDDYYYY date forward by whole years, keeping month and day. */
function addYears(mmddyyyy: string, years: number): string {
  const year = parseInt(mmddyyyy.substring(4, 8), 10);
  return mmddyyyy.substring(0, 4) + String(year + years);
}

/**
 * Builds a sample-fill record limited to the fields present in the schema.
 * Skips fields where we don't have a sample value (so the user keeps any
 * existing input they had for those).
 *
 * `stateCode` tailors the two values that are jurisdiction-specific: DAQ (whose
 * format several states enforce as a hard error) and the expiry date (whose
 * span several states cap below the sample's default). Without it the sample
 * fill produced a form the generator then refused for 12 of the 55
 * jurisdictions.
 */
export function buildSampleFill(
  schemaFields: AAMVAField[],
  stateCode?: string
): Record<string, string> {
  const out: Record<string, string> = {};

  const licenseNumber = stateCode ? AAMVA_STATE_RULES[stateCode]?.generators?.DAQ?.() : undefined;

  // Keep the sample's validity window inside the jurisdiction's own cap; 5
  // years is the app's default term where the jurisdiction allows at least that.
  const maxValidity = getEffectiveDateRules(stateCode ?? "").maxValidityYears ?? 5;
  const expiry = addYears(SAMPLE_ISSUE_DATE, Math.min(5, maxValidity));

  for (const field of schemaFields) {
    let value = SAMPLE_FILL_VALUES[field.code];
    if (field.code === "DAQ" && licenseNumber) value = licenseNumber;
    if (field.code === "DBA") value = expiry;
    if (field.code === "DAJ" && stateCode) value = stateCode;
    if (value !== undefined && value !== "") out[field.code] = value;
  }
  return out;
}
