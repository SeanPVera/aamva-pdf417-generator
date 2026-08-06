export interface BarcodeDimension {
  widthInches: number;
  heightInches: number;
}

// AAMVA DL/ID Card Design Standard target barcode area on a CR80 credential.
// Used as the fallback for jurisdictions without a documented override.
export const DEFAULT_BARCODE_DIMENSIONS: BarcodeDimension = {
  widthInches: 3.0,
  heightInches: 1.0
};

// Per-jurisdiction overrides for the printed PDF417 area. Values reflect
// commonly observed proportions on issued credentials; jurisdictions that
// follow the AAMVA-standard 3.0" x 1.0" footprint are intentionally omitted
// and inherit DEFAULT_BARCODE_DIMENSIONS.
export const BARCODE_DIMENSIONS: Record<string, BarcodeDimension> = {
  CA: { widthInches: 3.125, heightInches: 1.0 },
  TX: { widthInches: 3.125, heightInches: 1.0 },
  NY: { widthInches: 2.875, heightInches: 1.0 },
  FL: { widthInches: 3.0, heightInches: 1.125 },
  IL: { widthInches: 3.0, heightInches: 0.95 },
  PA: { widthInches: 3.0, heightInches: 1.05 },
  OH: { widthInches: 3.0, heightInches: 1.0 },
  MI: { widthInches: 3.0, heightInches: 1.05 },
  GA: { widthInches: 3.0, heightInches: 1.0 },
  NC: { widthInches: 3.0, heightInches: 1.0 },
  NJ: { widthInches: 2.875, heightInches: 1.0 },
  VA: { widthInches: 3.0, heightInches: 1.0 },
  WA: { widthInches: 3.0, heightInches: 1.0 },
  AZ: { widthInches: 3.0, heightInches: 1.0 },
  MA: { widthInches: 3.0, heightInches: 1.0 },
  CO: { widthInches: 3.0, heightInches: 1.0 },
  MD: { widthInches: 3.0, heightInches: 1.0 },
  TN: { widthInches: 3.0, heightInches: 1.0 },
  IN: { widthInches: 3.0, heightInches: 1.0 },
  WI: { widthInches: 3.0, heightInches: 1.0 },
  MN: { widthInches: 3.0, heightInches: 1.0 }
};

export function getBarcodeDimensions(stateCode: string): BarcodeDimension {
  return BARCODE_DIMENSIONS[stateCode] ?? DEFAULT_BARCODE_DIMENSIONS;
}

/** Pixels per module the on-screen preview renders at. */
export const PREVIEW_SCALE = 2;

/**
 * bwip-js encoder options shared by the preview and the exports.
 *
 * `columns` is deliberately absent. Pinning a low column count made the symbol
 * taller than it was wide for an ordinary payload — nothing like the landscape
 * strip on a credential — and capped the encodable payload at roughly 717 bytes
 * before bwip-js threw "insufficient capacity". Letting BWIPP choose keeps the
 * symbol landscape and lets it add columns rather than fail as payloads grow.
 */
export const PDF417_ENCODER_OPTIONS = {
  bcid: "pdf417",
  scale: PREVIEW_SCALE,
  eclevel: 5,
  compact: false as const,
  paddingwidth: 2,
  paddingheight: 2
} as const;

export interface ExportLayout {
  /** Pixels per PDF417 module to render at. Always a positive integer. */
  scale: number;
  drawWidth: number;
  drawHeight: number;
  offsetX: number;
  offsetY: number;
}

/**
 * Works out how to place a PDF417 symbol inside the credential's barcode area
 * without distorting it.
 *
 * Both axes must share one integer scale factor. A PDF417 scanner measures the
 * relative widths of the bars inside each 17-module codeword and relies on row
 * height being at least 3x the X-dimension; scaling the axes independently (or
 * by a fractional factor, which makes neighbouring modules land on different
 * pixel counts) breaks both assumptions and the symbol stops decoding. An
 * integer scale keeps every module exactly the same size, and the leftover
 * space becomes quiet zone rather than stretch.
 */
export function computeExportLayout(
  moduleWidth: number,
  moduleHeight: number,
  targetWidth: number,
  targetHeight: number
): ExportLayout {
  if (moduleWidth <= 0 || moduleHeight <= 0) {
    return { scale: 1, drawWidth: 0, drawHeight: 0, offsetX: 0, offsetY: 0 };
  }

  const fit = Math.min(targetWidth / moduleWidth, targetHeight / moduleHeight);
  const scale = Math.max(1, Math.floor(fit));

  const drawWidth = moduleWidth * scale;
  const drawHeight = moduleHeight * scale;

  return {
    scale,
    drawWidth,
    drawHeight,
    offsetX: Math.round((targetWidth - drawWidth) / 2),
    offsetY: Math.round((targetHeight - drawHeight) / 2)
  };
}
