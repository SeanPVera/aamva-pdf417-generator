// Reference presence and source fidelity. Passing byte comparisons run in
// conformance.test.ts; this inventory alone does not run the encoder.
import { AAMVA_STATES } from "../src/core/states.ts";
import {
  computeCoverage,
  formatCoverage,
  loadVectors,
  validateProvenance
} from "../src/tests/support/conformanceVectors.ts";

const vectors = loadVectors();
const malformed = vectors.flatMap(validateProvenance);
if (malformed.length) {
  console.error(malformed.join("\n"));
  process.exit(1);
}
const jurisdictions = Object.keys(AAMVA_STATES);
const report = computeCoverage(vectors, jurisdictions);
console.log(formatCoverage(report, jurisdictions.length));
console.log(`  covered: ${report.realWorldJurisdictions.join(", ")}`);
console.log(`  observed combinations: ${report.referenceCombinations.join(", ")}`);
const syntheticOnly = report.unverifiedJurisdictions.filter((state) =>
  vectors.some((vector) => vector.state === state)
);
console.log(`Synthetic-only jurisdictions: ${syntheticOnly.length} (${syntheticOnly.join(", ")})`);
console.log(
  `Jurisdictions with no vector: ${report.unverifiedJurisdictions.length - syntheticOnly.length}`
);
console.log(
  "Scope: individual reference layouts; no claim of coverage for every edition, document type, or physical card quality."
);
console.log(
  "Reference inventory only. Run conformance.test.ts and scanOracle.test.ts to check parity and rendered symbols."
);
