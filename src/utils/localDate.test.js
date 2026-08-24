import { describe, it, expect } from 'vitest';
import { toLocalDateString, todayDateString } from './localDate';

describe('toLocalDateString', () => {
  it('returns the local calendar day, not the UTC one', () => {
    // Local midnight on 26 July. Under UTC+7 this instant is 17:00 on the
    // 25th in UTC, which is exactly the off-by-one the helper exists to fix.
    const localMidnight = new Date(2026, 6, 26);
    expect(toLocalDateString(localMidnight)).toBe('2026-07-26');
  });

  it('keeps the same day for a local time late in the evening', () => {
    const lateEvening = new Date(2026, 7, 24, 23, 30);
    expect(toLocalDateString(lateEvening)).toBe('2026-08-24');
  });

  it('keeps the same day for a local time early in the morning', () => {
    // Before 07:00 is where the raw toISOString() approach reported yesterday
    // in Thailand.
    const earlyMorning = new Date(2026, 7, 24, 1, 15);
    expect(toLocalDateString(earlyMorning)).toBe('2026-08-24');
  });

  it('handles month and year boundaries', () => {
    expect(toLocalDateString(new Date(2026, 0, 1))).toBe('2026-01-01');
    expect(toLocalDateString(new Date(2025, 11, 31))).toBe('2025-12-31');
  });

  it('pads single-digit months and days', () => {
    expect(toLocalDateString(new Date(2026, 2, 5))).toBe('2026-03-05');
  });
});

describe('todayDateString', () => {
  it('matches the local calendar date', () => {
    const now = new Date();
    const expected = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, '0'),
      String(now.getDate()).padStart(2, '0')
    ].join('-');
    expect(todayDateString()).toBe(expected);
  });
});
