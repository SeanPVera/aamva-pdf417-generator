import { describe, it, expect } from 'vitest';
import { decodeAAMVAFormat } from '../core/decoder';
import { generateAAMVAPayload } from '../core/generator';
import { getFieldsForStateAndVersion } from '../core/schema';

describe('AAMVA decoder', () => {
  it('strips carriage return from the last parsed field value', () => {
    const state = 'CA';
    const version = '10';
    const fields = getFieldsForStateAndVersion(state, version);

    const payload = generateAAMVAPayload(state, version, fields, {
      DAQ: 'D1234567',
      DCF: 'ABCDEFGH1234',
      DCS: 'DOE',
      DAC: 'JANE',
      DBB: '01011990',
      DBA: '01012030',
      DBD: '01012024',
      DBC: '2',
      DAY: 'BRO',
      DAU: '510',
      DAG: '123 MAIN ST',
      DAI: 'LOS ANGELES',
      DAJ: 'CA',
      DAK: '90001',
      DCG: 'USA',
      DCA: 'C',
      DCB: 'NONE',
      DCD: 'NONE',
      DDE: 'N',
      DDF: 'N',
      DDG: 'N',
    });

    const result = decodeAAMVAFormat(payload);

    expect(result.error).toBeUndefined();
    expect(result.data?.DCG).toBe('USA');
  });
});
