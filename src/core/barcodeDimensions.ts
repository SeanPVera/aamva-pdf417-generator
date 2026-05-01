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
