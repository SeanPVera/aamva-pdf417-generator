#!/usr/bin/env node
/*
 * Prints the CHANGELOG.md section for a given version, for use as the body of
 * a GitHub Release.
 *
 * Usage: node scripts/release-notes.mjs 1.0.0 [path/to/CHANGELOG.md]
 *
 * Exits non-zero if the version has no section, so the release workflow can
 * fall back to GitHub's auto-generated notes rather than publishing an empty
 * release body.
 */

import fs from "node:fs";
import path from "node:path";

const version = process.argv[2];
const changelogPath = path.resolve(process.argv[3] || "CHANGELOG.md");

if (!version) {
  console.error("usage: release-notes.mjs <version> [changelog path]");
  process.exit(2);
}

if (!fs.existsSync(changelogPath)) {
  console.error(`no changelog at ${changelogPath}`);
  process.exit(1);
}

const lines = fs.readFileSync(changelogPath, "utf8").split(/\r?\n/);

// Changesets emits one `## <version>` heading per release.
const isVersionHeading = (line) => /^##\s+/.test(line);
const headingVersion = (line) => line.replace(/^##\s+/, "").trim();

const start = lines.findIndex((l) => isVersionHeading(l) && headingVersion(l) === version);
if (start === -1) {
  console.error(`no "## ${version}" section in ${changelogPath}`);
  process.exit(1);
}

let end = lines.length;
for (let i = start + 1; i < lines.length; i++) {
  if (isVersionHeading(lines[i])) {
    end = i;
    break;
  }
}

const body = lines
  .slice(start + 1, end)
  .join("\n")
  .trim();

if (!body) {
  console.error(`"## ${version}" section is empty`);
  process.exit(1);
}

process.stdout.write(body + "\n");
