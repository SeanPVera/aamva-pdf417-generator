// Prints what fraction of the jurisdictions this project claims to support are
// actually backed by a real-world conformance vector.
//
// The point is to keep an uncomfortable number in front of people. "Supports
// every jurisdiction" describes what resolves in code; this describes what has
// been checked against something a DMV issued. Run with:
//
//   npm run conformance:report
//
// Needs Node >= 22 for native TypeScript stripping (it imports states.ts).
//
// Exits non-zero only if a vector's provenance block is malformed — the
// coverage figure itself is reported, not enforced. The ratchet that stops
// coverage regressing lives in src/tests/conformanceProvenance.test.ts.
import { readdirSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { AAMVA_STATES } from "../src/core/states.ts";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const VECTORS_DIR = resolve(ROOT, "src/core/conformance/vectors");
const REAL_WORLD_TIERS = ["published", "issued"];

const vectors = readdirSync(VECTORS_DIR)
  .filter((f) => f.endsWith(".json"))
  .sort()
  .map((f) => JSON.parse(readFileSync(resolve(VECTORS_DIR, f), "utf8")));

const jurisdictions = Object.keys(AAMVA_STATES);
const byTier = { synthetic: 0, published: 0, issued: 0 };
const realWorld = new Set();
const malformed = [];

for (const v of vectors) {
  const tier = v.provenance?.tier;
  if (!tier || !(tier in byTier)) {
    malformed.push(`${v.id ?? "(unnamed)"}: missing or unknown provenance.tier`);
    continue;
  }
  byTier[tier] += 1;
  if (REAL_WORLD_TIERS.includes(tier)) realWorld.add(v.state);
}

const verified = realWorld.size;
const pct = ((verified / jurisdictions.length) * 100).toFixed(1);

console.log("AAMVA conformance corpus");
console.log("========================");
console.log(`vectors:                    ${vectors.length}`);
console.log(`  synthetic (regression):   ${byTier.synthetic}`);
console.log(`  published (AAMVA cards):  ${byTier.published}`);
console.log(`  issued (real, anonymised):${byTier.issued}`);
console.log("");
console.log(`jurisdictions in code:      ${jurisdictions.length}`);
console.log(`verified against reality:   ${verified} (${pct}%)`);

if (verified > 0) {
  console.log(`  covered: ${[...realWorld].sort().join(", ")}`);
}
if (byTier.published + byTier.issued === 0) {
  console.log("");
  console.log("No real-world vectors yet: every expected-bytes value in the corpus");
  console.log("was produced by this implementation, so the corpus currently proves");
  console.log("the encoder is stable, not that it is correct.");
}

if (malformed.length > 0) {
  console.error("\nMalformed vectors:");
  for (const m of malformed) console.error(`  ${m}`);
  process.exit(1);
}
