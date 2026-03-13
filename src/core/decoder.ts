import { AAMVA_STATES } from './states';
import { AAMVA_VERSIONS } from './schema';

export interface ValidationResult {
  ok: boolean;
  error?: string;
}

export function validateAAMVAPayloadStructure(payload: string, strictMode = false): ValidationResult {
  if (!payload || typeof payload !== 'string') return { ok: false, error: 'Empty or invalid payload' };
  if (payload.length < 31) return { ok: false, error: 'Payload too short for AAMVA header and directory' };

  if (payload.charAt(0) !== '@') return { ok: false, error: 'Invalid compliance indicator' };
  if (payload.charAt(1) !== '\n') return { ok: false, error: 'Invalid data element separator' };
  if (payload.charAt(2) !== '\x1e') return { ok: false, error: 'Invalid record separator' };
  if (payload.charAt(3) !== '\r') return { ok: false, error: 'Invalid segment terminator' };
  if (payload.substring(4, 9) !== 'ANSI ') return { ok: false, error: 'Invalid file type' };
  if (!/^\d{6}$/.test(payload.substring(9, 15))) return { ok: false, error: 'Invalid IIN' };
  if (!/^\d{2}$/.test(payload.substring(15, 17))) return { ok: false, error: 'Invalid AAMVA version token' };
  if (!/^\d{2}$/.test(payload.substring(17, 19))) return { ok: false, error: 'Invalid jurisdiction version token' };

  const numEntriesStr = payload.substring(19, 21);
  if (!/^\d{2}$/.test(numEntriesStr)) return { ok: false, error: 'Invalid directory entry count' };

  const numEntries = parseInt(numEntriesStr, 10);
  if (numEntries < 1) return { ok: false, error: 'AAMVA payload must contain at least one subfile entry' };

  const directoryEnd = 21 + numEntries * 10;
  if (payload.length < directoryEnd) return { ok: false, error: 'Payload truncated before directory entries' };

  const dirType = payload.substring(21, 23);
  if (dirType !== 'DL' && dirType !== 'ID') return { ok: false, error: 'First directory entry must be DL or ID' };

  const offset = parseInt(payload.substring(23, 27), 10);
  const length = parseInt(payload.substring(27, 31), 10);

  if (!Number.isFinite(offset) || !Number.isFinite(length)) return { ok: false, error: 'Invalid directory offset/length' };
  if (offset < directoryEnd) return { ok: false, error: 'Offset points inside directory' };
  if (length < 3) return { ok: false, error: 'Subfile length is too short' };

  const subfileEnd = offset + length;
  if (subfileEnd > payload.length) return { ok: false, error: 'Subfile length exceeds payload size' };

  const subfileMarker = payload.substring(offset, offset + 2);
  if (subfileMarker !== 'DL' && subfileMarker !== 'ID') return { ok: false, error: 'Subfile marker at offset must be DL or ID' };

  if (strictMode) {
    // Stricter checks if necessary
  }

  return { ok: true };
}

export interface DecodeResult {
  error?: string;
  data?: Record<string, string>;
  ok?: boolean;
  json?: Record<string, string>;
  mapped?: string;
}

export function decodePayload(text: string): DecodeResult {
  if (!text || typeof text !== 'string') return { error: 'Empty or invalid input' };

  if (text.charAt(0) === '@') return decodeAAMVAFormat(text);

  try {
    const obj = JSON.parse(text);
    if (!obj || typeof obj !== 'object') return { error: 'Not a valid payload' };
    return { data: obj };
  } catch {
    return { error: 'Unrecognized payload format' };
  }
}

export function decodeAAMVAFormat(text: string): DecodeResult {
  try {
    const strictValidation = validateAAMVAPayloadStructure(text);
    if (!strictValidation.ok) return { error: strictValidation.error };

    const iin = text.substring(9, 15);
    const version = text.substring(15, 17);
    const dirType = text.substring(21, 23);

    if (dirType !== 'DL' && dirType !== 'ID') return { error: 'No DL or ID subfile found in directory' };

    const subfileOffset = parseInt(text.substring(23, 27), 10);
    const subfileLength = parseInt(text.substring(27, 31), 10);
    const fieldData = text.substring(subfileOffset + 2, subfileOffset + subfileLength);

    const obj: Record<string, string> = { version: version };
    const entries = fieldData.split('\n');

    for (const entry of entries) {
      if (entry.length >= 3) {
        const code = entry.substring(0, 3);
        let value = entry.substring(3);
        value = value.replace(/\r$/, '');
        if (code.match(/^[A-Z]{2}[A-Z0-9]$/)) {
          obj[code] = value;
        }
      }
    }

    if (AAMVA_STATES) {
      for (const [stateCode, stateDef] of Object.entries(AAMVA_STATES)) {
        if (stateDef && stateDef.IIN === iin) {
          obj.state = stateCode;
          break;
        }
      }
    }

    return { data: obj };
  } catch (err) {
    return { error: 'Failed to parse AAMVA payload: ' + (err as Error).message };
  }
}

export function describeFields(obj: Record<string, string>): string {
  if (!obj.version || !AAMVA_VERSIONS[obj.version]) {
    return 'Unknown version — cannot map fields.\n' + JSON.stringify(obj, null, 2);
  }

  const def = AAMVA_VERSIONS[obj.version];
  const lines = [`AAMVA ${def.name}`, ''];

  def.fields.forEach((f) => {
    const val = obj[f.code] ?? '';
    lines.push(`${f.code}: ${val}   (${f.label})`);
  });

  return lines.join('\n');
}

export function decodeAAMVA(text: string): DecodeResult {
  const base = decodePayload(text);
  if (base.error) return { error: base.error };

  const obj = base.data!;
  return {
    ok: true,
    json: obj,
    mapped: describeFields(obj)
  };
}
