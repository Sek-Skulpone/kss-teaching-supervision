import { describe, it, expect } from 'vitest';
import { formatThaiDate, formatThaiDateFull } from './thaiDate';

describe('formatThaiDate', () => {
  it('formats a valid ISO date into the short Thai (Buddhist-era) format', () => {
    expect(formatThaiDate('2026-06-17')).toBe('17 มิ.ย. 2569');
  });

  it('returns an empty string for falsy input', () => {
    expect(formatThaiDate('')).toBe('');
    expect(formatThaiDate(null)).toBe('');
    expect(formatThaiDate(undefined)).toBe('');
  });

  it('returns the raw string unchanged for malformed input instead of NaN', () => {
    expect(formatThaiDate('not-a-date')).toBe('not-a-date');
    expect(formatThaiDate('2026-13-01')).toBe('2026-13-01');
    expect(formatThaiDate('2026/06/17')).toBe('2026/06/17');
  });
});

describe('formatThaiDateFull', () => {
  it('formats a valid ISO date into the full Thai (Buddhist-era) format', () => {
    expect(formatThaiDateFull('2026-06-17')).toBe('วันที่ 17 มิถุนายน พ.ศ. 2569');
  });

  it('returns an empty string for falsy input', () => {
    expect(formatThaiDateFull('')).toBe('');
  });

  it('returns the raw string unchanged for malformed input instead of NaN', () => {
    expect(formatThaiDateFull('nonsense')).toBe('nonsense');
  });
});
