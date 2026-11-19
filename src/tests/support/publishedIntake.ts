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
export const publishedObservations = readdirSync(directory)
  .filter((file) => file.endsWith(".json"))
  .sort()
  .flatMap((file) => {
    const manifest: { payloads: PublishedObservation[] } = JSON.parse(
      readFileSync(resolve(directory, file), "utf8")
    );
    return manifest.payloads;
  });
