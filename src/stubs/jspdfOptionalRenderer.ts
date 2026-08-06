// jspdf lists html2canvas, dompurify, and canvg as optionalDependencies and
// reaches them only through its .html() renderer. This app never calls that
// path — PDF export builds pages from a canvas via addImage (BatchProcessor) —
// so the code is unreachable at runtime.
//
// Left alone, Vite still resolves jspdf's `import("html2canvas")` calls and
// emits the chunks anyway: 378 kB raw / 105 kB gzipped of JS that can never
// run, and which the service worker dutifully precaches for offline use.
// vite.config aliases all three specifiers to this module.
//
// This module must stay free of top-level side effects. Bundling can fold it
// into the same chunk as jspdf rather than keeping it behind the dynamic
// import, so anything thrown at module scope runs when the chunk is evaluated
// — outside the `.catch()` jspdf wraps those imports in — and takes the whole
// PDF-export chunk (and BarcodePreview along with it) down on load.
//
// Instead the export throws only when something actually touches it. That
// matters most for dompurify: a silently empty stub could look like HTML was
// sanitized when it never was, so any real use fails loudly.

const MESSAGE =
  "jsPDF's optional renderer dependencies (html2canvas, dompurify, canvg) are " +
  "deliberately excluded from this bundle because the app does not use " +
  "jsPDF.html(). To enable them, drop the aliases in vite.config.";

function unavailable(): never {
  throw new Error(MESSAGE);
}

// A Proxy so every shape of use fails with the same clear message: calling it
// (html2canvas(el)), constructing it, or reading a member (DOMPurify.sanitize).
const stub = new Proxy(unavailable, {
  get(_target, prop) {
    // Let bundlers and `await import()` interop probe these without throwing.
    if (prop === "__esModule" || prop === Symbol.toStringTag) return undefined;
    if (prop === "default") return stub;
    unavailable();
  },
  apply: unavailable,
  construct: unavailable
});

export default stub;
