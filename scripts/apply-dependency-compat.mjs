// Scoped compatibility rewrites for electron packaging helpers.
// Fail-safe: skip with a warning when packages, versions, or source digests
// do not match — never throw from postinstall.
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const warn = (message) => console.warn(`[apply-dependency-compat] ${message}`);

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

const digest = (value) => createHash("sha256").update(value).digest("hex");

for (const patch of patches) {
  try {
    const parent =
      patch.package === "temp" ? createRequire(require.resolve("electron-winstaller")) : require;
    let entry;
    try {
      entry = parent.resolve(patch.package);
    } catch {
      warn(`Skipping ${patch.package}: package not installed`);
      continue;
    }
    let packageRoot = path.dirname(entry);
    while (!fs.existsSync(path.join(packageRoot, "package.json"))) {
      const next = path.dirname(packageRoot);
      if (next === packageRoot) {
        warn(`Skipping ${patch.package}: could not locate package root`);
        packageRoot = null;
        break;
      }
      packageRoot = next;
    }
    if (!packageRoot) continue;

    const metadata = JSON.parse(fs.readFileSync(path.join(packageRoot, "package.json"), "utf8"));
    if (metadata.name !== patch.package || metadata.version !== patch.version) {
      warn(
        `Skipping ${patch.package}: expected ${patch.version}, found ${metadata.name}@${metadata.version}`
      );
      continue;
    }

    const file = path.join(packageRoot, patch.entry);
    if (!fs.existsSync(file)) {
      warn(`Skipping ${patch.package}: missing ${patch.entry}`);
      continue;
    }
    const source = fs.readFileSync(file, "utf8");
    if (digest(source) === patch.patchedSha256) {
      console.log("Verified existing compatibility patch: " + patch.package);
      continue;
    }
    if (digest(source) !== patch.originalSha256) {
      warn(`Skipping ${patch.package}: unexpected installed source digest`);
      continue;
    }
    let updated = source;
    let ok = true;
    for (const edit of patch.edits) {
      if (updated.split(edit.before).length !== 2) {
        warn(`Skipping ${patch.package}: ambiguous or missing patch site`);
        ok = false;
        break;
      }
      updated = updated.replace(edit.before, edit.after);
    }
    if (!ok) continue;
    if (digest(updated) !== patch.patchedSha256) {
      warn(`Skipping ${patch.package}: patched digest mismatch`);
      continue;
    }
    fs.writeFileSync(file, updated);
    console.log("Applied compatibility patch: " + patch.package);
  } catch (error) {
    warn(`Skipping ${patch.package}: ${error instanceof Error ? error.message : String(error)}`);
  }
}
