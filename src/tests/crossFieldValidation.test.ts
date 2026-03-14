import { describe, expect, test } from 'vitest';
import { getFieldsForStateAndVersion } from '../core/schema';
import { validateCrossFieldConsistency } from '../core/validation';
import { generateAAMVAPayload } from '../core/generator';

describe('cross-field validation', () => {
  test('returns error when expiration date is earlier than issue date', () => {
    const fields = getFieldsForStateAndVersion('CA', '10');
    const issues = validateCrossFieldConsistency(
      { DBB: '01011990', DBD: '01012030', DBA: '01012020' },
      fields
    );

    expect(issues.some((issue) => issue.severity === 'error' && issue.code === 'DBA')).toBe(true);
  });

  test('returns warning for under-14 issuance age', () => {
    const fields = getFieldsForStateAndVersion('CA', '10');
    const issues = validateCrossFieldConsistency(
      { DBB: '01012015', DBD: '01012024', DBA: '01012030' },
      fields
    );

    expect(issues.some((issue) => issue.severity === 'warning' && issue.code === 'DBB')).toBe(true);
  });

  test('strict mode treats warning cross-field issues as blocking', () => {
    const fields = getFieldsForStateAndVersion('CA', '10');
    const data = {
      DCS: 'DOE',
      DAC: 'JANE',
      DBB: '01012015',
      DBA: '01012030',
      DBD: '01012024',
      DAQ: 'A1234567',
      DAG: '123 MAIN ST',
      DAI: 'LOS ANGELES',
      DAJ: 'CA',
      DAK: '90001',
      DBC: '2',
      DAU: '509',
      DAY: 'BRO',
      DAZ: 'BLK',
      DCG: 'USA',
      DCF: 'AB12/3456/7890',
      DCA: 'D',
      DCB: 'NONE',
      DCD: 'NONE',
      DDE: 'N',
      DDF: 'N',
      DDG: 'N',
    };

    expect(() =>
      generateAAMVAPayload('CA', '10', fields, { ...data }, { strictMode: true })
    ).toThrow(/Cross-field validation failed/);

    expect(() =>
      generateAAMVAPayload('CA', '10', fields, { ...data }, { strictMode: false })
    ).not.toThrow();
  });
});
