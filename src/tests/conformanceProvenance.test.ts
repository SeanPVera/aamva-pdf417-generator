import { describe, it, expect } from "vitest";

import { AAMVA_STATES } from "../core/states";
import {
  computeCoverage,
  formatCoverage,
  loadVectors,
  REAL_WORLD_TIERS,
  validateProvenance,
  VECTOR_TIERS
} from "./support/conformanceVectors";

/**
 * The number of jurisdictions that must have at least one published or issued
 * vector. This is a ratchet, not a target: raise it when real-world vectors are
 * added so the corpus can never quietly lose evidence it once had.
 *
 * It sits at 0 because the corpus is currently all synthetic — every vector was
 * written by our own encoder. That is an honest statement of where the project
 * is, and the number is here so it stays visible instead of being implied by an
 * empty directory.
 */
const MIN_REAL_WORLD_JURISDICTIONS = 0;

describe("conformance vector provenance", () => {
  const vectors = loadVectors();

  it("has vectors to check", () => {
    expect(vectors.length).toBeGreaterThan(0);
  });

  for (const vector of vectors) {
    it(`${vector.id} declares where its bytes came from`, () => {
      expect(validateProvenance(vector)).toEqual([]);
      expect(VECTOR_TIERS).toContain(vector.provenance.tier);
    });
  }

  it("never lets a synthetic vector claim to be external evidence", () => {
    for (const vector of vectors) {
      if (!REAL_WORLD_TIERS.includes(vector.provenance.tier)) continue;
      // A real-world vector has to name a source that is not us.
      expect(
        vector.provenance.source.includes("gen-vectors"),
        `${vector.id} claims tier "${vector.provenance.tier}" but was produced by our own generator`
      ).toBe(false);
    }
  });

  it("reports real-world jurisdiction coverage and never regresses", () => {
    const jurisdictions = Object.keys(AAMVA_STATES);
    const report = computeCoverage(vectors, jurisdictions);

    // Printed on every run so the gap between "supported" and "verified" is a
    // number somebody sees, not a footnote nobody reads.
    console.info(formatCoverage(report, jurisdictions.length));

    expect(report.total).toBe(vectors.length);
    expect(
      report.realWorldJurisdictions.length,
      `Real-world coverage dropped below the ratchet (${MIN_REAL_WORLD_JURISDICTIONS}). ` +
        "If you removed a published/issued vector on purpose, lower the constant deliberately."
    ).toBeGreaterThanOrEqual(MIN_REAL_WORLD_JURISDICTIONS);
  });

  it("keeps the ratchet honest about what is actually in the corpus", () => {
    const jurisdictions = Object.keys(AAMVA_STATES);
    const report = computeCoverage(vectors, jurisdictions);

    // Guards the other direction: if real-world vectors get added and nobody
    // raises the ratchet, this fails and asks them to.
    expect(
      report.realWorldJurisdictions.length,
      `The corpus now covers ${report.realWorldJurisdictions.length} jurisdiction(s) with ` +
        `real-world vectors but MIN_REAL_WORLD_JURISDICTIONS is still ` +
        `${MIN_REAL_WORLD_JURISDICTIONS}. Raise it to lock the gain in.`
    ).toBeLessThanOrEqual(MIN_REAL_WORLD_JURISDICTIONS);
  });

  it("counts every jurisdiction without real-world evidence as unverified", () => {
    const jurisdictions = Object.keys(AAMVA_STATES);
    const report = computeCoverage(vectors, jurisdictions);

    expect(report.realWorldJurisdictions.length + report.unverifiedJurisdictions.length).toBe(
      jurisdictions.length
    );
    // Support in code is not the same claim as verified against reality.
    for (const state of report.realWorldJurisdictions) {
      expect(report.unverifiedJurisdictions).not.toContain(state);
    }
  });
});
