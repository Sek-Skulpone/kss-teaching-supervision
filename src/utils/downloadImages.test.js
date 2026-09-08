import { describe, it, expect, beforeEach, vi } from 'vitest';
import { downloadImages } from './downloadImages';

// The helper drives a real <a download> click, so the few DOM pieces it
// touches are stubbed here and the clicks recorded.
let clicked;

beforeEach(() => {
  clicked = [];
  globalThis.URL.createObjectURL = vi.fn(() => 'blob:stub');
  globalThis.URL.revokeObjectURL = vi.fn();
  globalThis.document = {
    body: { appendChild: vi.fn() },
    createElement: () => {
      const link = { click: () => clicked.push(link.download), remove: () => {} };
      return link;
    }
  };
});

const jpeg = (tag) => `data:image/jpeg;base64,${btoa(tag)}`;
const png = (tag) => `data:image/png;base64,${btoa(tag)}`;

describe('downloadImages', () => {
  it('saves one numbered file per photo', async () => {
    const saved = await downloadImages([jpeg('a'), jpeg('b'), jpeg('c')], 'PLC_วงรอบที่3_ครูสมชาย_2569');

    expect(saved).toBe(3);
    expect(clicked).toEqual([
      'PLC_วงรอบที่3_ครูสมชาย_2569_1.jpg',
      'PLC_วงรอบที่3_ครูสมชาย_2569_2.jpg',
      'PLC_วงรอบที่3_ครูสมชาย_2569_3.jpg'
    ]);
  });

  it('keeps each photo\'s own format', async () => {
    await downloadImages([png('a'), jpeg('b')], 'ภาพ');
    expect(clicked).toEqual(['ภาพ_1.png', 'ภาพ_2.jpg']);
  });

  it('strips characters a file name cannot hold, and keeps Thai text', async () => {
    await downloadImages([jpeg('a')], 'PLC/วงรอบ: 3 "ครู ก"');
    expect(clicked).toEqual(['PLCวงรอบ_3_ครู_ก_1.jpg']);
  });

  it('does nothing when there is nothing to save', async () => {
    expect(await downloadImages([], 'ภาพ')).toBe(0);
    expect(await downloadImages(undefined, 'ภาพ')).toBe(0);
    expect(clicked).toEqual([]);
  });

  it('skips entries that are not stored photos', async () => {
    expect(await downloadImages([jpeg('a'), null, 'https://example.com/x.jpg'], 'ภาพ')).toBe(1);
    expect(clicked).toEqual(['ภาพ_1.jpg']);
  });
});
