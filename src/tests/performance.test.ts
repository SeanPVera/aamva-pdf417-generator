/**
 * Performance benchmarks for core AAMVA library functions.
 *
 * Each test runs a hot function N times, records wall-clock ms, and
 * asserts a soft budget so the suite stays green while surfacing regressions.
 *
 * Run with: npx vitest run src/tests/performance.test.ts
 */

import { describe, it, expect } from "vitest";
import { getFieldsForStateAndVersion, getFieldsForVersion } from "../core/schema";
import {
  validateFieldValue,
  evaluateFieldValue,
  validateCrossFieldConsistency
} from "../core/validation";
import { decodeAAMVAFormat } from "../core/decoder";
import { generateAAMVAPayload } from "../core/generator";
import { AAMVA_STATES } from "../core/states";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function bench(label: string, fn: () => void, iterations = 10_000): number {
  // Warm-up
  for (let i = 0; i < 100; i++) fn();
  const t0 = performance.now();
  for (let i = 0; i < iterations; i++) fn();
  const elapsed = performance.now() - t0;
  console.log(
    `[bench] ${label}: ${iterations.toLocaleString()} iters in ${elapsed.toFixed(2)} ms  (${((elapsed / iterations) * 1000).toFixed(3)} µs/op)`
  );
  return elapsed;
}

// A realistic minimal payload for decoder benchmarks
const CA_FIELDS = getFieldsForVersion("10");
const CA_DATA: Record<string, string> = {
  state: "CA",
  version: "10",
  DCA: "C",
  DCB: "NONE",
  DCD: "NONE",
  DBA: "12312030",
  DCS: "SMITH",
  DAC: "JOHN",
  DAD: "A",
  DBD: "01012020",
  DBB: "01011990",
  DBC: "1",
  DAY: "BRO",
  DAU: "510",
  DAG: "123 MAIN ST",
  DAH: "",
  DAI: "LOS ANGELES",
  DAJ: "CA",
  DAK: "90001",
  DAQ: "D1234567",
  DCF: "AB1234/5678/9012",
  DCG: "USA",
  DDE: "N",
  DDF: "N",
  DDG: "N"
};
const SAMPLE_PAYLOAD = generateAAMVAPayload("CA", "10", CA_FIELDS, { ...CA_DATA });

// ---------------------------------------------------------------------------
// 1. getFieldsForStateAndVersion — repeated cache-cold (no prior memoization)
// ---------------------------------------------------------------------------

describe("Performance: getFieldsForStateAndVersion", () => {
  it("handles 10k calls across all state/version combos quickly", () => {
    const states = Object.keys(AAMVA_STATES);
    const versions = ["04", "08", "09", "10"];
    let idx = 0;
    const elapsed = bench(
      "getFieldsForStateAndVersion",
      () => {
        const s = states[idx % states.length];
        const v = versions[idx % versions.length];
        idx++;
        getFieldsForStateAndVersion(s, v);
      },
      10_000
    );
    // Very generous budget — this is a baseline, not a strict gate
    expect(elapsed).toBeLessThan(5_000);
  });
});

// ---------------------------------------------------------------------------
// 2. validateFieldValue — constrained option set path
// ---------------------------------------------------------------------------

describe("Performance: validateFieldValue (constrained options)", () => {
  it("validates 50k constrained-option field values quickly", () => {
    const eyeField = CA_FIELDS.find((f) => f.code === "DAY")!;
    const sexField = CA_FIELDS.find((f) => f.code === "DBC")!;
    const countryField = CA_FIELDS.find((f) => f.code === "DCG")!;
    let i = 0;
    const elapsed = bench(
      "validateFieldValue (constrained)",
      () => {
        // Rotate through fields and values to avoid JIT over-optimizing a single path
        if (i % 3 === 0) validateFieldValue(eyeField, "BRO", "CA");
        else if (i % 3 === 1) validateFieldValue(sexField, "1", "CA");
        else validateFieldValue(countryField, "USA", "CA");
        i++;
      },
      50_000
    );
    expect(elapsed).toBeLessThan(5_000);
  });
});

// ---------------------------------------------------------------------------
// 3. evaluateFieldValue — same path but richer return value
// ---------------------------------------------------------------------------

describe("Performance: evaluateFieldValue (constrained options)", () => {
  it("evaluates 50k constrained-option fields quickly", () => {
    const eyeField = CA_FIELDS.find((f) => f.code === "DAY")!;
    const elapsed = bench(
      "evaluateFieldValue (DAY=BRO, CA)",
      () => evaluateFieldValue(eyeField, "BRO", "CA"),
      50_000
    );
    expect(elapsed).toBeLessThan(5_000);
  });
});

// ---------------------------------------------------------------------------
// 4. validateCrossFieldConsistency — repeated Array.find() for date formats
// ---------------------------------------------------------------------------

describe("Performance: validateCrossFieldConsistency", () => {
  it("runs 20k cross-field validations quickly", () => {
    const values: Record<string, string> = {
      DBB: "01011990",
      DBD: "01012020",
      DBA: "12312030",
      DDB: "06152019"
    };
    const elapsed = bench(
      "validateCrossFieldConsistency (CA, v10)",
      () => validateCrossFieldConsistency(values, CA_FIELDS, "CA"),
      20_000
    );
    expect(elapsed).toBeLessThan(5_000);
  });
});

// ---------------------------------------------------------------------------
// 5. decodeAAMVAFormat — IIN lookup (O(n) linear scan)
// ---------------------------------------------------------------------------

describe("Performance: decodeAAMVAFormat (IIN lookup)", () => {
  it("decodes 5k payloads quickly", () => {
    const elapsed = bench(
      "decodeAAMVAFormat (CA payload)",
      () => decodeAAMVAFormat(SAMPLE_PAYLOAD),
      5_000
    );
    expect(elapsed).toBeLessThan(5_000);
  });
});
