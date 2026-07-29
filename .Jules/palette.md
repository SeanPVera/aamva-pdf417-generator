## 2025-05-14 - Focus Management & Tour Interaction
**Learning:** Adding interactive overlays (like a Welcome Tour) can disrupt keyboard navigation flow and break E2E tests that expect immediate access to the underlying UI. Modals must implement focus restoration to satisfy WCAG 2.1 (Success Criterion 2.4.3), and E2E suites require explicit "dismiss" helpers to maintain stability in CI environments where the tour might persistent across sessions.
**Action:** Always implement focus restoration using `useId` and `useEffect` cleanup for new overlays, and provide a `dismissTour` utility in `e2e/helpers.ts` to be called at the start of all visual/interaction tests.

## 2026-07-29 - WebKit CSP HTTP-to-HTTPS Upgrade Failures
**Learning:** The inclusion of `upgrade-insecure-requests;` in the HTML Content-Security-Policy meta tag forces WebKit-based mobile/desktop browsers (such as Playwright WebKit and Mobile Safari) to upgrade local development or preview HTTP requests (`http://localhost:3000`) to HTTPS, resulting in SSL/TLS handshake failures, blank screens, and E2E test timeouts.
**Action:** Omit the `upgrade-insecure-requests;` directive from standard HTML headers in environments where local preview servers are run over HTTP, relying instead on production routing layers or server configurations to enforce HTTPS.
