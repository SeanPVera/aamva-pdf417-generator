# Contributing to aamva-pdf417-generator

Thanks for your interest in contributing. This project is a fully client-side AAMVA PDF417 barcode generator covering versions 01–10 across 54 U.S. jurisdictions. Because the AAMVA spec is detailed and state-specific, contributions that touch the encoder, decoder, or validation rules need extra care.

## Quick start

```bash
git clone https://github.com/SeanPVera/aamva-pdf417-generator.git
cd aamva-pdf417-generator
npm install
npm run dev          # http://localhost:3000
```

Other useful scripts:

| Command | Purpose |
|---|---|
| `npm test` | Vitest in watch mode |
| `npm run test:run` | Vitest single run |
| `npm run test:coverage` | Vitest with coverage thresholds |
| `npm run test:e2e` | Playwright end-to-end tests |
| `npm run lint` | ESLint (`--max-warnings 0`) |
| `npm run format` | Prettier write |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run size` | size-limit bundle budget check |
| `npm run electron:dev` | Vite + Electron together |

Husky runs `lint-staged` on `pre-commit` and `npm run typecheck` on `pre-push`.

## Where to make changes

- **AAMVA field definitions** — `src/core/schema.ts` (do not invent or alter 3-character field codes; they are standardized).
- **Jurisdictions / IINs** — `src/core/states.ts` (IINs must match the official AAMVA issuer codes exactly).
- **State-specific generators / regex rules** — `src/core/generator.ts`, `src/core/validation.ts`.
- **Decoder** — `src/core/decoder.ts`.
- **UI** — `src/components/`, styled with Tailwind utility classes and CSS custom properties from `src/core/stateThemes.ts`.

See `CLAUDE.md` for a fuller architecture map.

## Pull request checklist

Before opening a PR:

- [ ] `npm run lint` passes with no warnings
- [ ] `npm run format:check` passes
- [ ] `npm run typecheck` passes
- [ ] `npm run test:run` passes
- [ ] If you changed `src/core/**`, you added or updated a test in `src/tests/`
- [ ] If you changed an AAMVA field, jurisdiction, or validation rule, your PR description cites the relevant section of the AAMVA DL/ID Card Design Standard or the jurisdiction's published spec
- [ ] If you changed bundle composition or added a dependency, `npm run size` still passes the budgets in `.size-limit.json`

## Code style

- TypeScript everywhere in `src/`; CommonJS only in `main.js` and `preload.js`.
- 2-space indent, double quotes, no trailing commas, 100-char lines, semicolons on (Prettier-enforced).
- Functional React components with hooks. No class components except `ErrorBoundary`.
- Comments are for the *why*, not the *what*. Don't paraphrase the code.
- ES modules in `src/`. No `require()` inside `src/`.

## What not to do

- Do not relax Electron security flags (`nodeIntegration`, `contextIsolation`, `sandbox`) in `main.js`.
- Do not add network requests — this app is offline-only.
- Do not persist PII (no IndexedDB, cookies, remote storage). Only UI preferences are persisted.
- Do not add an alternate test runner. Vitest only.
- Do not bypass the pre-commit hook with `--no-verify` to "fix CI later" — fix the underlying issue.

## Reporting bugs / requesting features

Use the issue templates under `.github/ISSUE_TEMPLATE/`. For security issues, see `SECURITY.md` instead of opening a public issue.

## License

By contributing, you agree your contributions are licensed under the MIT License (see `LICENSE`).
