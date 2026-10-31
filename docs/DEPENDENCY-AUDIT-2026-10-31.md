# Dependency remediation as of October 31, 2026

The unchanged `npm audit --audit-level=high` release gate passes. The installed and locked graph contains **zero high or critical vulnerabilities**. The production-only audit contains **zero vulnerabilities**. The full graph still reports 26 moderate affected-package entries, rooted in two development-tool advisories.

## Changes

- Electron is updated to 45.2.1 and Undici to 7.30.1 through a compatible 7.x override. The lockfile also advances patched build and utility dependencies, including Vite 8.3.5, DOMPurify 3.4.17, shell-quote 1.12.0, and concurrently 9.2.5.
- Vitest and its V8 coverage provider move together to 4.1.12. The test command and threshold enforcement remain enabled.
- Installation now requires Node 22.12 or later. `.nvmrc` selects Node 24, and CI runs Node 22 and 24 with independent matrix outcomes.
- `bwip-js` remains exactly 4.11.4. Its independently verified Latin-1 fix must survive unrelated dependency updates.

The audit threshold, browser isolation, validation rules, coverage thresholds, and bundle budget remain enabled. No forced historical downgrade or incompatible global minimatch replacement was applied.

## Residual moderate advisories

| Advisory | Affected path | Current disposition |
| --- | --- | --- |
| [Glob cancellation bypass](https://github.com/advisories/GHSA-3g3m-2fjr-6pw4) | Development and packaging utilities that depend on glob | Remains in the development graph; no production audit findings |
| [Minimatch globparts amplification](https://github.com/advisories/GHSA-g3hv-75wg-m249) | ESLint, packaging, and related development utilities | Remains in the development graph; replacing all historical major versions with 11.x would require separate compatibility work |

The 26 reported entries include transitive parents of these two advisory roots. They are not 26 distinct root advisories. The current automatic force-fix suggestion includes downgrading electron-builder to 20.23.1, which does not establish a compatible remediation for this project.

## Verification

- Node 22.23.4: 1,561 tests pass in 72 files.
- Node 24.22.1: 1,561 tests pass in 72 files; the default CI test command also passes without additional runtime flags.
- Coverage: 93.46% statements, 87.61% branches, 96.08% functions, and 94.92% lines.
- Type checking, ESLint, Prettier, production build, and size checks pass. Initial JavaScript is 54.73 KB against the existing 55 KB budget.
- Six browser cases have independent ZXing-C++ byte readback, including signed accented v12 data on desktop and mobile.
- The macOS arm64 package launches with Electron 45.2.1, Chromium 156.0.8078.75, and embedded Node 24.22.1. Colorado and Montana imports render with context isolation and sandboxing enabled and Node integration disabled. Independent readback matches 318 and 386 source bytes. A dedicated temporary app profile was verified before interaction.

An ad-hoc app bundle launched from macOS `/tmp` intermittently showed a local-file load error. The identical bundle loaded from a user cache location and passed import and readback checks. This evidence covers a macOS arm64 smoke check. Windows/Linux packaging, signed distribution, notarization, and physical scanners were not verified here. Hosted checks must be read against the final pushed commit.

Official release notes: [Electron 45.2.1](https://github.com/electron/electron/releases/tag/v45.2.1), [Undici 7.30.1](https://github.com/nodejs/undici/releases/tag/v7.30.1).
