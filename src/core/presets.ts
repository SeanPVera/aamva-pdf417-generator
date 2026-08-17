export interface QuickFillPreset {
  id: string;
  label: string;
  description: string;
  state: string;
  version: string;
  fields: Record<string, string>;
}

let cached: QuickFillPreset[] | null = null;

/**
 * Loads the quick-fill sample records.
 *
 * Dynamic so the records stay out of the first-paint bundle — they are inert
 * data behind a menu, and `presetData.ts` is the only place they live. The
 * result is memoised, so opening the menu a second time costs nothing.
 */
export async function loadQuickFillPresets(): Promise<QuickFillPreset[]> {
  if (!cached) {
    const mod = await import("./presetData");
    cached = mod.QUICK_FILL_PRESETS;
  }
  return cached;
}
