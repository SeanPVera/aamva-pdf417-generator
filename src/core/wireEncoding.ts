/** Values exclude framing bytes and C1 controls. CDS 2026 D.6 uses ISO-8859-1. */
export function isPrintableWireValue(value: string, latin1 = false): boolean {
  return !(latin1 ? /[^\x20-\x7e\xa0-\xff]/ : /[^\x20-\x7e]/).test(value);
}
