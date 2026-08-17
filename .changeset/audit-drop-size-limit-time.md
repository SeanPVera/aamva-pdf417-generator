---
"aamva-pdf417-generator": patch
---

Clear the 8 high-severity advisories that were failing `npm audit --audit-level=high` in CI.

`@size-limit/preset-app` is `@size-limit/file` plus `@size-limit/time`, and the timing plugin drags in `estimo` → `puppeteer-core` → `@puppeteer/browsers` → `extract-zip`, which carries an unvalidated-symlink path-traversal advisory (GHSA-jmr9-qjv8-65gv). Every budget in `.size-limit.json` is a file-size budget — nothing measures execution time — so the timing half was pulling a browser stack to provide a capability this repo never asked for. Depending on `@size-limit/file` directly drops 54 packages and all six budgets are still enforced unchanged.

Separately, `postcss` resolved `nanoid` below 3.3.18 (GHSA-2v37-7h3g-55p8), so a `nanoid: ^3.3.18` override replaces the now-dead `estimo` override.
