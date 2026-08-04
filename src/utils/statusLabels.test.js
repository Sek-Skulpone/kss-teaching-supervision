import { describe, it, expect } from 'vitest';
import { STATUS_LABEL_SETS, getStatusLabel } from './statusLabels';

describe('getStatusLabel', () => {
  it('returns the label for a known status in the given set', () => {
    expect(getStatusLabel('completed', 'modal')).toBe(STATUS_LABEL_SETS.modal.completed);
    expect(getStatusLabel('pending', 'list')).toBe(STATUS_LABEL_SETS.list.pending);
    expect(getStatusLabel('approved', 'compact')).toBe(STATUS_LABEL_SETS.compact.approved);
  });

  it('defaults to the "modal" set when no set name is given', () => {
    expect(getStatusLabel('pending')).toBe(STATUS_LABEL_SETS.modal.pending);
  });

  it('falls back to the "modal" set for an unknown set name', () => {
    expect(getStatusLabel('completed', 'nonexistent')).toBe(STATUS_LABEL_SETS.modal.completed);
  });

  it('returns an empty string for an unknown status', () => {
    expect(getStatusLabel('bogus_status', 'modal')).toBe('');
  });
});
