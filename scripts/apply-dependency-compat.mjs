// These two scoped compatibility changes keep patched matchers and cleanup APIs.
// Exact package versions and complete source digests prevent silent patch drift.
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const patches = [
  {
    package: "@electron/universal",
    version: "3.0.6",
    entry: "dist/file-utils.js",
    edits: [
      {
        before: "import path from 'node:path';",
        after: "import path from 'node:path';\nimport { minimatch } from 'minimatch';"
      },
      {
        before:
          "export const matchGlob = (filePath, pattern) => {\n    return path.matchesGlob(pattern.includes('/') ? filePath : path.basename(filePath), pattern);\n};",
        after:
          "export const matchGlob = (filePath, pattern) => {\n    return minimatch(filePath, pattern, { matchBase: true });\n};"
      }
    ],
    originalSha256: "8f26d82c2b9931c5319de1cb49d8922c89e9023b8e3fc746e47d33f146fd6ec0",
    patchedSha256: "c5cd697858c573b87572b7c32f4f3b8a0cc7e9a7ffc9abd79ff2790ba492a4ec"
  },
  {
    package: "temp",
    version: "0.9.4",
    entry: "lib/temp.js",
    edits: [
      {
        before: "let rimraf     = require('rimraf');",
        after:
          "let rimrafModule = require('rimraf');\nlet rimraf = (target, options, callback) => {\n  rimrafModule.rimraf(target, { maxRetries: options.maxBusyTries }).then(\n    () => callback(),\n    callback\n  );\n};\nrimraf.sync = (target, options) =>\n  rimrafModule.rimrafSync(target, { maxRetries: options.maxBusyTries });"
      }
    ],
    originalSha256: "ab00e9972ccbd639a4558519f40ad6839cb2c616b3da6cb9c12dea2828c6c9c9",
    patchedSha256: "c249bcf65ab8fd8b89fc65c6543171113c0348bd5092fab8bf196bf7fdbda327"
  }
];
for (const patch of patches) {
  const parent =
    patch.package === "temp" ? createRequire(require.resolve("electron-winstaller")) : require;
  const entry = parent.resolve(patch.package);
  let packageRoot = path.dirname(entry);
  while (!fs.existsSync(path.join(packageRoot, "package.json"))) {
    const next = path.dirname(packageRoot);
    if (next === packageRoot) throw new Error("Could not locate " + patch.package);
    packageRoot = next;
  }
  const metadata = JSON.parse(fs.readFileSync(path.join(packageRoot, "package.json"), "utf8"));
  if (metadata.name !== patch.package || metadata.version !== patch.version)
    throw new Error("Review compatibility patch for " + patch.package + "@" + metadata.version);
  const file = path.join(packageRoot, patch.entry);
  const source = fs.readFileSync(file, "utf8");
  const digest = (value) => createHash("sha256").update(value).digest("hex");
  if (digest(source) === patch.patchedSha256) {
    console.log("Verified existing compatibility patch: " + patch.package);
    continue;
  }
  if (digest(source) !== patch.originalSha256)
    throw new Error("Unexpected installed source for " + patch.package);
  let updated = source;
  for (const edit of patch.edits) {
    if (updated.split(edit.before).length !== 2)
      throw new Error("Ambiguous compatibility patch for " + patch.package);
    updated = updated.replace(edit.before, edit.after);
  }
  if (digest(updated) !== patch.patchedSha256)
    throw new Error("Compatibility patch digest mismatch for " + patch.package);
  fs.writeFileSync(file, updated);
  console.log("Applied compatibility patch: " + patch.package);
}
