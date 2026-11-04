import { readdirSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { describe, expect, it } from "vitest";

import intake25 from "../core/conformance/published/2026-10-25.json";
import intake31 from "../core/conformance/published/2026-10-31.json";
import continuation from "../core/conformance/published/2026-10-31-continuation.json";
import ledger from "../core/conformance/coverage-ledger-2026-10-31.json";
import iinRegistry from "../core/conformance/iin-registry-2026-10-31.json";
import observed from "../core/conformance/observed-profiles.json";
import observedProvenance from "../core/conformance/observed-profile-provenance.json";

const vectorsDir = path.resolve(__dirname, "../core/conformance/vectors");

describe("specimen vectors and ledgers", () => {
  const intakes = [intake25, intake31, continuation] as const;

  it("keeps published intake payloads content-addressed and URL-backed", () => {
    for (const intake of intakes) {
      expect(intake.payloads.length).toBeGreaterThan(0);
      for (const specimen of intake.payloads) {
        expect(specimen.sourceUrl).toMatch(/^https:\/\//);
        expect(specimen.sha256).toMatch(/^[a-f0-9]{64}$/);
        expect(specimen.rawBytesLatin1.length).toBe(specimen.byteLength);
        const digest = createHash("sha256")
          .update(Buffer.from(specimen.rawBytesLatin1, "latin1"))
          .digest("hex");
        expect(digest).toBe(specimen.sha256);
      }
    }
  });

  it("ships vector files that parse and declare provenance", () => {
    const files = readdirSync(vectorsDir).filter((name) => name.endsWith(".json"));
    expect(files.length).toBeGreaterThan(20);
    for (const name of files) {
      const vector = JSON.parse(readFileSync(path.join(vectorsDir, name), "utf8")) as {
        id?: string;
        expectedBytes?: string;
        provenance?: unknown;
      };
      expect(vector.id, name).toBeTruthy();
      expect(vector.expectedBytes, name).toBeTruthy();
      expect(vector.provenance, name).toBeTruthy();
    }
  });

  it("keeps coverage ledger, IIN registry, and observed profiles well-formed", () => {
    expect(ledger.asOf).toBeTruthy();
    expect(ledger.jurisdictions).toBeTruthy();
    expect(Array.isArray(iinRegistry.rows)).toBe(true);
    expect(Array.isArray(observed)).toBe(true);
    expect(observed.length).toBeGreaterThan(0);
    expect(observedProvenance).toBeTruthy();
  });
});
