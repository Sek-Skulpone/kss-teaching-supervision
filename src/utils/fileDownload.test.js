import { describe, it, expect } from 'vitest';
import { safeFileName, isStoredFile, parseDataUrl, imageFiles } from './fileDownload';

const jpeg = (tag) => `data:image/jpeg;base64,${btoa(tag)}`;

describe('safeFileName', () => {
  it('strips characters a file name cannot hold, and keeps Thai text', () => {
    expect(safeFileName('PLC/วงรอบ: 3 "ครู ก"')).toBe('PLCวงรอบ_3_ครู_ก');
  });

  it('falls back rather than producing an empty name', () => {
    expect(safeFileName('')).toBe('ภาพ');
    expect(safeFileName(null)).toBe('ภาพ');
  });
});

describe('parseDataUrl', () => {
  it('reads the format off the stored photo', () => {
    expect(parseDataUrl(jpeg('a')).extension).toBe('jpg');
    expect(parseDataUrl('data:image/png;base64,AAAA').extension).toBe('png');
    expect(parseDataUrl('data:application/pdf;base64,AAAA').extension).toBe('pdf');
  });

  it('treats an unknown format as a photo', () => {
    expect(parseDataUrl('data:application/zzz;base64,AAAA').extension).toBe('jpg');
  });
});

describe('isStoredFile', () => {
  it('accepts only stored files', () => {
    expect(isStoredFile(jpeg('a'))).toBe(true);
    expect(isStoredFile('https://example.com/x.jpg')).toBe(false);
    expect(isStoredFile(null)).toBe(false);
  });
});

describe('imageFiles', () => {
  it('numbers the photos it is given', () => {
    expect(imageFiles([jpeg('a'), jpeg('b')], 'PLC_วงรอบที่3_2569').map(f => f.name))
      .toEqual(['PLC_วงรอบที่3_2569_1', 'PLC_วงรอบที่3_2569_2']);
  });

  it('skips anything that is not a stored photo, without leaving a gap', () => {
    expect(imageFiles(['https://example.com/x.jpg', jpeg('a'), null], 'ภาพ').map(f => f.name))
      .toEqual(['ภาพ_1']);
  });

  it('has nothing to name when there are no photos', () => {
    expect(imageFiles([], 'ภาพ')).toEqual([]);
    expect(imageFiles(undefined, 'ภาพ')).toEqual([]);
  });
});
