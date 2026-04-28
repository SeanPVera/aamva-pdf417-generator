---
"aamva-pdf417-generator": minor
---

Professional-grade tooling pass:

- **Strict TypeScript**: enabled `noUncheckedIndexedAccess` and `noImplicitOverride` across production code; `any` is now an ESLint error.
- **Property-based tests**: ~6,000 randomized inputs per CI run via `fast-check`, exercising encoder/decoder round-trips and structural validation across 24 jurisdiction × version combinations.
- **Public API barrel**: `src/core/index.ts` defines the supported surface; package metadata in place for future extraction to `@aamva/core` on npm.
- **Conformance corpus**: golden vectors under `src/core/conformance/vectors/` lock encoder output byte-for-byte. Six baseline vectors (CA, NY, TX, FL, IL, WA).
- **Changesets release automation**: every PR can include a `.changeset/*.md` file; the release workflow opens a Version Packages PR and publishes on merge.
- **Typecheck CI gate**: `npm run typecheck` runs in CI alongside lint, format check, build, and tests.
