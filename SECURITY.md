# Security Policy

## Threat Model

`aamva-pdf417-generator` is a fully client-side tool that builds AAMVA-format
PDF417 barcodes. Its design constraints define the security posture:

- **No network calls.** The application is offline-capable by design. The
  production CSP enforces `connect-src 'none'` so the runtime cannot exfiltrate
  data even if a dependency is compromised.
- **No PII persistence.** Field values that constitute personally identifiable
  information are intentionally excluded from the encrypted Zustand store.
- **Sandboxed Electron shell.** `nodeIntegration: false`,
  `contextIsolation: true`, and `sandbox: true` are non-negotiable.
- **No remote dependencies at runtime.** All assets ship in the bundle. There
  are no CDN scripts, no analytics, no remote fonts.

## In Scope

Vulnerabilities affecting:

- The `@aamva/core` library (encoder, decoder, validation logic).
- The browser application as built from `main`.
- The Electron shell (`main.js`, `preload.js`).
- Build/release tooling under `.github/workflows/`.

## Out of Scope

- End-user misuse of generated barcodes. This tool is intended for legitimate
  development, testing, and educational use cases (verifying scanner software,
  reproducing AAMVA spec edge cases, etc.). Producing barcodes that
  impersonate real-world identification with intent to defraud is illegal in
  every U.S. jurisdiction and is not a vulnerability of this software.
- Forks of the codebase.
- Vulnerabilities in transitive dependencies that have already been disclosed
  upstream and have a fix available — please file these with the upstream
  maintainer or via Dependabot.

## Reporting a Vulnerability

Please **do not** open a public GitHub issue for security reports.

Instead, use GitHub's private vulnerability reporting on this repository, or
email the maintainer (see the `author` field in `package.json`). Include:

- A clear description of the issue and its impact.
- Reproduction steps or a proof-of-concept.
- The commit SHA or release version where you observed the issue.
- Any suggested mitigation, if applicable.

Expect an acknowledgment within **5 business days** and a substantive response
within **14 business days**. Critical issues are prioritized.

## Hardening Inventory

| Layer        | Mitigation                                                                |
| ------------ | ------------------------------------------------------------------------- |
| CSP (prod)   | `default-src 'self'`, `connect-src 'none'`, `frame-ancestors 'none'`      |
| CSP (dev)    | Same, with `connect-src 'self' ws: wss:` for HMR only                     |
| Electron     | `nodeIntegration: false`, `contextIsolation: true`, `sandbox: true`       |
| Storage      | AES-encrypted localStorage; PII fields excluded from persistence          |
| Dependencies | `npm audit --audit-level=high` runs in CI on every PR                     |
| Types        | `strict`, `noUncheckedIndexedAccess`, `no-explicit-any` all enforced      |
| Tests        | 300+ unit tests, ~6,000 property-based runs, golden conformance vectors   |

## Disclosure Coordination

We follow a **90-day** coordinated disclosure window from the date of acknowledgment.
If we cannot ship a fix within that window we will request an extension with
clear justification. Reporters who follow this policy in good faith will be
credited in the changelog and (if desired) in the release announcement.
