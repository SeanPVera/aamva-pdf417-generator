import { describe, it, expect } from "vitest";
import { getFieldsForVersion } from "../core/schema";
import { generateAAMVAPayload } from "../core/generator";

function bench(label: string, fn: () => void, iterations = 10_000): number {
  for (let i = 0; i < 100; i++) fn();
  const t0 = performance.now();
  for (let i = 0; i < iterations; i++) fn();
  const elapsed = performance.now() - t0;
  console.log(
    `[bench] ${label}: ${iterations.toLocaleString()} iters in ${elapsed.toFixed(2)} ms  (${((elapsed / iterations) * 1000).toFixed(3)} µs/op)`
  );
  return elapsed;
}

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

describe("Performance: generateAAMVAPayload", () => {
  it("generates 10k payloads quickly", () => {
    const elapsed = bench(
      "generateAAMVAPayload (CA payload)",
      () => generateAAMVAPayload("CA", "10", CA_FIELDS, { ...CA_DATA }),
      10_000
    );
    expect(elapsed).toBeLessThan(5_000);
  });
});
