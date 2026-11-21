import { readdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

interface PublishedObservation {
  id: string;
  jurisdiction: string;
  sha256: string;
  rawBytesLatin1: string;
  sourceSha256: string;
  imageSha256: string;
}

const directory = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../core/conformance/published"
);
interface AnonymizedObservation {
  originalPayloadSha256: string;
  anonymizedPayloadSha256: string;
  fileSha256: string;
  nativeImageSha256: string;
  sourceUrl: string;
  bytes: number;
  replacements: Array<{
    field: string;
    start: number;
    endExclusive: number;
    byteLength: number;
    replacement: string;
  }>;
}

interface IntakeManifest {
  payloads: PublishedObservation[];
  anonymizedObservations?: AnonymizedObservation[];
}

const manifests = readdirSync(directory)
  .filter((file) => file.endsWith(".json"))
  .sort()
  .map((file): IntakeManifest => JSON.parse(readFileSync(resolve(directory, file), "utf8")));

export const publishedObservations = manifests.flatMap((manifest) => manifest.payloads);
export const anonymizedObservations = manifests.flatMap(
  (manifest) => manifest.anonymizedObservations ?? []
);
