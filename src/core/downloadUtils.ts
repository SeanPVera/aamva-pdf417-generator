/**
 * iOS-compatible file download utility.
 *
 * iOS Safari ignores the `download` attribute on <a> tags for blob: URLs,
 * so we use the Web Share API (iOS 15+) when available, and fall back to
 * opening the blob in a new tab so the user can save from there.
 */

function isIOS(): boolean {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    // iPad on iOS 13+ reports as MacIntel with touch points
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

/**
 * Download a Blob as a file, with full iOS Safari compatibility.
 *
 * @param blob     The data to download.
 * @param filename Suggested filename including extension.
 */
export async function downloadBlob(blob: Blob, filename: string): Promise<void> {
  const file = new File([blob], filename, { type: blob.type });

  // Web Share API with files — available in iOS 15+ Safari and modern Android Chrome
  if (
    typeof navigator.share === "function" &&
    typeof navigator.canShare === "function" &&
    navigator.canShare({ files: [file] })
  ) {
    try {
      await navigator.share({ files: [file], title: filename });
      return;
    } catch {
      // User dismissed the share sheet or share failed — fall through to next method
    }
  }

  const url = URL.createObjectURL(blob);

  if (isIOS()) {
    // iOS Safari: open in new tab so the user can long-press → Save to Files / Photos
    const win = window.open(url, "_blank");
    if (!win) {
      // Pop-up blocked — last resort: navigate current tab
      window.location.href = url;
    }
    // Delay revocation so the new tab has time to load the resource
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  } else {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
