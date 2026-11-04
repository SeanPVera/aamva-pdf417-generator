import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { createRequire } from "node:module";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
import { setTimeout as delay } from "node:timers/promises";
import { execFileSync } from "node:child_process";
import { renderInstallerCases } from "./dependency-fixtures.mjs";

const require = createRequire(import.meta.url);
const { glob, globStream } = require("glob");
const { Minimatch } = require("minimatch");
const asar = require("@electron/asar");
const builderRoot = path.dirname(require.resolve("app-builder-lib/package.json"));
const { FileMatcher } = require("app-builder-lib/out/fileMatcher");
const universalEntry = require.resolve("@electron/universal");
const { matchGlob } = await import(
  pathToFileURL(path.join(path.dirname(universalEntry), "file-utils.js"))
);
const installerRequire = createRequire(require.resolve("electron-winstaller"));
const temp = installerRequire("temp");

function scratch(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "aamva-dependency-contract-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  return dir;
}

test("minimatch bounds optimization expansion and retains ordinary matches", () => {
  const matcher = new Minimatch(Array(12).fill("**/../segment/leaf").join("/"), {
    optimizationLevel: 2,
    braceExpandMax: 64
  });
  assert.ok(matcher.set.length <= 64);
  assert.equal(new Minimatch("**/*.{js,ts}", { dot: true }).match("nested/.hidden.ts"), true);
  assert.equal(new Minimatch("**/*.ts").match("nested/file.js"), false);
});

for (const api of ["glob", "globStream"]) {
  test(`${api} stops traversal when its first directory read aborts`, async (t) => {
    const dir = scratch(t);
    const makeTree = (parent, depth) => {
      fs.mkdirSync(parent, { recursive: true });
      fs.writeFileSync(path.join(parent, "leaf.txt"), "test");
      if (depth) for (let i = 0; i < 3; i++) makeTree(path.join(parent, `branch${i}`), depth - 1);
    };
    makeTree(dir, 3);
    const controller = new AbortController();
    let reads = 0;
    const customFs = {
      ...fs,
      readdir: (...args) => {
        reads++;
        if (reads === 1) controller.abort(new Error("contract-abort"));
        return fs.readdir(...args);
      }
    };
    const options = { cwd: dir, fs: customFs, signal: controller.signal };
    const walk =
      api === "glob"
        ? glob("**/*", options)
        : new Promise((resolve, reject) => {
            globStream("**/*", options).on("error", reject).on("end", resolve).resume();
          });
    await assert.rejects(walk, /contract-abort/);
    const atReject = reads;
    await delay(200);
    assert.equal(reads, atReject);
    assert.equal(reads, 1);
    assert.equal((await glob("**/*.txt", { cwd: dir })).length, 40);
  });
}

test("universal matching preserves the previous builder contract with the patched matcher", () => {
  const cases = [
    ["a/b.node", "*.node", true],
    ["a/b.js", "*.node", false],
    ["a/.hidden", "*", false],
    ["a/b.node", "a/**", true],
    ["a/deep/b.node", "a/*", false],
    ["a/abc.node", "*.{node,dll}", true],
    ["a/!literal", "!literal", true],
    ["a/#literal", "#literal", false],
    ["a/Foo.node", "foo.node", false],
    ["a/b.node", "**/../a/b.node", false],
    ["a/x/b.node", "a/**/b.node", true],
    ["Contents/Resources/app.asar.unpacked/x64/addon.node", "!**/arm64/**", true]
  ];
  for (const [file, pattern, expected] of cases) {
    assert.equal(matchGlob(file, pattern), expected, `${file}: ${pattern}`);
  }
  // The native Node matcher has a separate bundled copy. This call must use our
  // updated dependency even when that copy has not received the advisory fix.
  assert.equal(
    typeof matchGlob("ordinary", Array(12).fill("**/../segment/leaf").join("/")),
    "boolean"
  );
  const source = fs.readFileSync(path.join(path.dirname(universalEntry), "file-utils.js"), "utf8");
  assert.match(source, /import \{ minimatch \} from 'minimatch'/);
  assert.doesNotMatch(source, /path\.matchesGlob\(/);
});

test("ASAR preserves bytes, hidden paths, unpacked files and symlinks", async (t) => {
  const dir = scratch(t);
  const source = path.join(dir, "source");
  fs.mkdirSync(path.join(source, "nested"), { recursive: true });
  const raw = Buffer.from([0, 10, 13, 128, 255]);
  fs.writeFileSync(path.join(source, "nested", "space name.bin"), raw);
  fs.writeFileSync(path.join(source, ".hidden"), "hidden");
  fs.writeFileSync(path.join(source, "addon.node"), "native-placeholder");
  if (process.platform !== "win32")
    fs.symlinkSync("nested/space name.bin", path.join(source, "link"));
  const archive = path.join(dir, "test.asar");
  await asar.createPackageWithOptions(source, archive, { unpack: "*.node" });
  assert.deepEqual(asar.extractFile(archive, "nested/space name.bin"), raw);
  assert.equal(asar.extractFile(archive, ".hidden").toString(), "hidden");
  assert.equal(asar.statFile(archive, "addon.node").unpacked, true);
  assert.equal(fs.readFileSync(archive + ".unpacked/addon.node", "utf8"), "native-placeholder");
  if (process.platform !== "win32") assert.deepEqual(asar.extractFile(archive, "link"), raw);
});

test("electron-builder retains inclusion, ordered exclusion and partial directory matching", (t) => {
  const dir = scratch(t);
  const filter = new FileMatcher(dir, path.join(dir, "out"), (value) => value, [
    "nested/**/*",
    "!nested/private/**",
    "nested/private/allowed.txt",
    ".hidden"
  ]).createFilter();
  const stat = (directory) => ({ isDirectory: () => directory });
  for (const [relative, directory, expected] of [
    ["nested", true, true],
    ["nested/data.txt", false, true],
    ["nested/private", true, true],
    ["nested/private/secret.txt", false, false],
    ["nested/private/allowed.txt", false, true],
    [".hidden", false, true],
    ["other.txt", false, false]
  ])
    assert.equal(filter(path.join(dir, relative), stat(directory)), expected, relative);
});

test("rimraf explicit glob cleanup preserves unrelated literal paths", async (t) => {
  const dir = scratch(t);
  for (const name of ["remove-a.tmp", "remove-b.tmp", "keep [literal].txt"])
    fs.writeFileSync(path.join(dir, name), name);
  await require("rimraf").rimraf("remove-*.tmp", { glob: { cwd: dir, absolute: true } });
  assert.deepEqual(fs.readdirSync(dir), ["keep [literal].txt"]);
});

test("temp supports callback, promise and synchronous cleanup through rimraf 6", async (t) => {
  const dir = scratch(t);
  temp.track();
  const open = await temp.open({ dir, prefix: "file [literal] " });
  fs.closeSync(open.fd);
  const folder = await temp.mkdir({ dir, prefix: "dir [literal] " });
  fs.writeFileSync(path.join(folder, "child.txt"), "test");
  const counts = await new Promise((resolve, reject) =>
    temp.cleanup((error, value) => (error ? reject(error) : resolve(value)))
  );
  assert.deepEqual(counts, { files: 1, dirs: 1 });
  assert.equal(fs.existsSync(open.path), false);
  assert.equal(fs.existsSync(folder), false);
  await temp.mkdir({ dir });
  assert.deepEqual(await temp.cleanup(), { files: 0, dirs: 1 });
  await temp.mkdir({ dir });
  assert.deepEqual(temp.cleanupSync(), { files: 0, dirs: 1 });
  assert.deepEqual(fs.readdirSync(dir), []);
});

test("TypeScript project service retains allowDefaultProject matching", (t) => {
  const dir = scratch(t);
  const parser = require("@typescript-eslint/parser");
  const parse = (name, patterns) =>
    parser.parseForESLint("const answer: number = 42;", {
      filePath: path.join(dir, name),
      tsconfigRootDir: dir,
      projectService: { allowDefaultProject: patterns }
    });
  assert.equal(parse("allowed.ts", ["allowed.ts"]).ast.body.length, 1);
  assert.throws(
    () => parse("blocked.ts", ["allowed.ts"]),
    /not found|not included|allowDefaultProject/i
  );
  parser.clearCaches();
});

test("EJS renders the existing 128 installer cases identically to the baseline", () => {
  const rendered = renderInstallerCases(require("ejs"), builderRoot);
  assert.equal(rendered.length, 128);
  const digest = createHash("sha256").update(JSON.stringify(rendered)).digest("hex");
  assert.equal(digest, "3c1aeeea3e43087f38a242ff75f5a7f457488ed3384de909923ddb64d3d6f617");
});

test("dependency compatibility installation is idempotent", () => {
  assert.match(
    execFileSync(process.execPath, ["scripts/apply-dependency-compat.mjs"], { encoding: "utf8" }),
    /Verified existing compatibility patch/
  );
});
