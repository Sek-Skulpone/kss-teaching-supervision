import { describe, it, expect } from 'vitest';
import { OBSERVATION_ITEMS } from './observationItems';

describe('OBSERVATION_ITEMS', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(OBSERVATION_ITEMS)).toBe(true);
    expect(OBSERVATION_ITEMS.length).toBeGreaterThan(0);
  });

  it('every item has a unique id, a number label, and a text label', () => {
    const ids = new Set();
    OBSERVATION_ITEMS.forEach((item) => {
      expect(typeof item.id).toBe('string');
      expect(typeof item.no).toBe('string');
      expect(typeof item.label).toBe('string');
      expect(item.label.length).toBeGreaterThan(0);
      expect(ids.has(item.id)).toBe(false);
      ids.add(item.id);
    });
  });
});
