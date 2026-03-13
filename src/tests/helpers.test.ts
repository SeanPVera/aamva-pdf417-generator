import { describe, it, expect } from 'vitest';
import { validateFieldValue, sanitizeFieldValue } from '../core/validation';

describe('Validation Helpers', () => {
  it('sanitizes field values by removing control characters', () => {
    expect(sanitizeFieldValue('test\x00value')).toBe('testvalue');
    expect(sanitizeFieldValue('normal')).toBe('normal');
  });

  it('validates basic zip codes', () => {
    expect(validateFieldValue({ code: 'DAK', type: 'zip', label: 'Zip' } as any, '12345')).toBe(true);
    expect(validateFieldValue({ code: 'DAK', type: 'zip', label: 'Zip' } as any, '12345-6789')).toBe(true);
    expect(validateFieldValue({ code: 'DAK', type: 'zip', label: 'Zip' } as any, '1234')).toBe(false);
  });
});
