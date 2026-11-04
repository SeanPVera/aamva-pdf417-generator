# Dependency audit repair, October 31, 2026

The full installed dependency graph reports zero vulnerabilities at implementation commit `18d5fb5e9b15ec149f3b0c549e54f2478e7834e5`. The production-only audit also reports zero. This closes the preceding 26 moderate affected-package entries. CI now fails on low and higher severities.

## Changes and compatibility

- Glob resolves to 14.0.2 or later, minimatch to 11.0.1 or later, and EJS to 7.0.2 or later. The two advisory roots are [Glob cancellation bypass](https://github.com/advisories/GHSA-3g3m-2fjr-6pw4) and [minimatch pattern amplification](https://github.com/advisories/GHSA-g3hv-75wg-m249).
- ESLint moves to 10.14.0 with @eslint/js 10.0.1. The unused eslint-plugin-react dependency is removed; the configured React hooks and refresh plugins remain.
- @electron/universal is pinned to 3.0.6. A complete-source SHA-256-guarded postinstall patch routes its matching through patched minimatch and preserves the preceding `{ matchBase: true }` contract, including negation and case behavior.
- temp is pinned to 0.9.4. Its guarded adapter maps the historical callback and sync rimraf API to rimraf 6, with its retry value retained.
- EJS 7 removes the old Jake/filelist dependency branch. All 128 installer template cases render byte-identically to the preceding EJS 3.1.10 implementation.
- The installer refuses unexpected compatibility target versions or source bytes. Repeated installation verifies the already-applied hashes. Ordinary npm ci must run lifecycle scripts.
- Local installation requires Node 22.13 or later. CI checks Node 22 and 24.
- bwip-js remains exactly 4.11.4. The application source, conformance vectors, independent source payloads and version 12 oracle are unchanged by this repair.

The baseline abort reproducer made 117 additional directory reads after glob rejected and 120 after globStream rejected. The patched versions made zero additional reads. The bounded minimatch reproducer produced 4096 alternatives despite a configured limit of 64 in the baseline; the patched dependency kept the count at 64. These are bounded local reproductions of development-tool behavior.

## Independent review

A fresh read-only investigator checked the affected callers before implementation. A separate fresh read-only reviewer found that the first universal matcher adapter changed the baseline negation and case semantics. The final adapter preserves the baseline contract. The parent independently reproduced the discrepancy and checked the correction with explicit expected outcomes, including a negated architecture allowlist. The final macOS universal packaging job passed.

The reviewer reported no further concrete finding within its source review. Its review did not establish cross-platform execution; the hosted jobs below supply that separate evidence.

## Verification

- Clean installs passed with lifecycle scripts on Node 22.23.4 and Node 24.22.1.
- Each Node version passed all 1561 application tests in 72 files.
- Eleven focused dependency contracts passed on both Node versions. They cover cancellation, bounded optimization, universal allowlists, ASAR bytes and paths, ordered builder exclusions, glob deletion, callback/promise/sync cleanup, TypeScript project-service matching, installer templates and patch idempotence.
- Lint, formatting, type checks, production build and size limits passed.
- Local coverage: 93.46% statements, 87.61% branches, 96.08% functions and 94.92% lines.
- All 42 local Chromium browser tests passed on an isolated port. An earlier run was invalidated because the default port served another project. That existing server was left running; no result from that run supports this repair.
- Hosted Node CI: [41214045261](https://github.com/SeanPVera/aamva-pdf417-generator/actions/runs/41214045261), both Node jobs passed.
- Hosted browser CI: [41214045295](https://github.com/SeanPVera/aamva-pdf417-generator/actions/runs/41214045295), Chromium, Firefox, WebKit, mobile Chrome and mobile Safari passed.
- Hosted packaging: [41214045489](https://github.com/SeanPVera/aamva-pdf417-generator/actions/runs/41214045489), Windows NSIS, macOS universal directory output and Linux directory output passed. All three used publishing disabled.
- A separate local unsigned macOS arm64 directory build passed. This turn did not install or launch that package.

## Limits

Dependency remediation does not close the independent-source coverage objective. Passing source-layout fixtures still cover 15 of 55 jurisdictions, leaving 40 open. Version 12 retains 110 independent synthetic expectations and zero issuer-derived signed references. No signing, notarization, installer execution on end-user machines or physical scanner certification is claimed. The PR remains a draft and is unmerged.
