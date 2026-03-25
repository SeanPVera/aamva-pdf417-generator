# AGENTS.md

## Cursor Cloud specific instructions

### Project overview

AAMVA PDF417 Generator — a client-side React 19 + TypeScript + Vite app for generating AAMVA-formatted PDF417 barcodes. No backend services or databases required.

### Key commands

All standard dev commands are documented in `package.json` scripts and `README.md`. Quick reference:

| Task | Command |
|---|---|
| Dev server | `npm run dev` (port 3000) |
| Lint | `npm run lint` |
| Format check | `npm run format:check` |
| Tests | `npx vitest run` |
| Build | `npm run build` |

### Non-obvious notes

- **Tests use Vitest**, not Node's built-in `node:test` as CLAUDE.md states. Run `npx vitest run` for a single pass (not `npm test` which starts Vitest in watch mode by default).
- **`npm run format:check` has pre-existing failures** on `src/App.tsx` and `src/styles/index.css` in the repo. This is not caused by agent changes.
- The project has a husky pre-commit hook that runs `lint-staged` (ESLint + Prettier on staged `src/` files). If committing changes to `src/`, ensure lint and format pass on those files first.
- The Vite dev server runs on port 3000 (configured in `vite.config.ts`), not the default 5173.
- Electron desktop mode (`npm start`) is optional and not needed for standard development or testing.
- CLAUDE.md describes a legacy vanilla-JS structure; the actual codebase is React 19 + TypeScript + Vite under `src/`.
