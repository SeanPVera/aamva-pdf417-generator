# `@aamva/core`

The framework-free AAMVA implementation. This directory is a self-contained
package: zero React, zero DOM, zero bundler-specific imports. It implements the
AAMVA DL/ID specification (versions 01–10) for all 54 U.S. jurisdictions.

## Public API

Import from the barrel only:

```ts
import {
  generateAAMVAPayload,
  decodeAAMVA,
  AAMVA_VERSIONS,
  AAMVA_STATES,
  validateFieldValue
} from "@aamva/core";
```

The barrel (`index.ts`) is the supported, semver-stable API. Everything else is
considered internal.

## Module roles

| Module           | Responsibility                                                        |
| ---------------- | --------------------------------------------------------------------- |
| `schema.ts`      | AAMVA versions 01–10 field definitions, options, length limits        |
| `states.ts`      | 54 jurisdictions with IINs, default versions, supported flag          |
| `generator.ts`   | Encodes a record → AAMVA wire format string                           |
| `decoder.ts`     | Parses AAMVA wire format → field map; structural validation          |
| `validation.ts`  | Per-state regex rules, cross-field consistency, sanitization          |
| `stateThemes.ts` | Color palettes per jurisdiction (data only — `applyState…` is opt-in) |

## Design rules

1. **No DOM or React imports.** `applyStateThemeToDocument` is the sole DOM
   touchpoint and accepts an injectable `Document`.
2. **No network calls.** Ever.
3. **Deterministic where possible.** Random sources (`generateDocumentDiscriminator`)
   prefer `crypto.getRandomValues`.
4. **Round-trip stability.** `decode(encode(x))` must equal `x` for any record
   the generator accepts. Verified by property tests in `src/tests/property.test.ts`.

## Future extraction

This directory is structured to be lifted into `packages/aamva-core` as a
standalone npm package without source changes. The local `package.json` here
documents the intended public surface.
