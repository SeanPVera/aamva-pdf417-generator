// Shared browser-download helper.
//
// The object URL is revoked on a later task rather than immediately after
// `click()`. Revoking synchronously tears the blob down before some browsers
// (notably Safari and Firefox) have started reading it, which silently drops
// the download. One minute is far longer than any handoff needs and still
// bounds how long the blob is retained.
const REVOKE_DELAY_MS = 60_000;

/** Triggers a download of `blob` as `filename`. */
export function downloadBlob(blob: Blob, filename: string): void {
  downloadUrl(URL.createObjectURL(blob), filename, true);
}

/**
 * Triggers a download of an already-built URL. Set `revoke` for object URLs;
 * `data:` URLs need no cleanup.
 */
export function downloadUrl(url: string, filename: string, revoke = false): void {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  a.click();
  if (revoke) {
    setTimeout(() => URL.revokeObjectURL(url), REVOKE_DELAY_MS);
  }
}
