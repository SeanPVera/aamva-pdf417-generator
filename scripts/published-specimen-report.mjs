import { readFileSync } from "node:fs";

const intake = JSON.parse(
  readFileSync(
    new URL("../src/core/conformance/published/2026-10-25.json", import.meta.url),
    "utf8"
  )
);
const { stats } = intake;
console.log(`Published specimen intake captured ${intake.capturedAt}`);
console.log(`Compared against repository commit ${intake.repositoryCommit}`);
console.log(`Curated image assets: ${stats.imageAssets}`);
console.log(
  `Image jurisdictions (${stats.imageJurisdictions.length}): ${stats.imageJurisdictions.join(", ")}`
);
console.log(`Distinct independently scanned payloads: ${stats.distinctPayloads}`);
console.log(
  `Payload jurisdictions (${stats.payloadJurisdictions.length}): ${stats.payloadJurisdictions.join(", ")}`
);
console.log(`Application decoder accepted at capture: ${stats.decoderAccepted}`);
for (const [status, count] of Object.entries(stats.generatorResults)) {
  console.log(`Generator comparison at capture, ${status}: ${count}`);
}
console.log(
  "This is a captured intake snapshot. It does not increase passing encoder conformance coverage."
);
