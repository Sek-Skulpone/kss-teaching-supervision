import { describe, it, expect } from 'vitest';
import { zipEntryPaths, buildZipBlob } from './zipDownload';

const jpeg = (tag) => `data:image/jpeg;base64,${btoa(tag)}`;
const pdf = (tag) => `data:application/pdf;base64,${btoa(tag)}`;

describe('zipEntryPaths', () => {
  it('puts each teacher in their own folder', () => {
    const paths = zipEntryPaths([
      { folder: 'ครูสมชาย ดีงาม', name: 'PLC_วงรอบที่3_2569_1', dataUrl: jpeg('a') },
      { folder: 'ครูสมชาย ดีงาม', name: 'PLC_วงรอบที่3_2569_2', dataUrl: jpeg('b') },
      { folder: 'ครูสมศรี แสนดี', name: 'PLC_วงรอบที่3_2569_1', dataUrl: jpeg('c') }
    ]).map(entry => entry.path);

    expect(paths).toEqual([
      'ครูสมชาย_ดีงาม/PLC_วงรอบที่3_2569_1.jpg',
      'ครูสมชาย_ดีงาม/PLC_วงรอบที่3_2569_2.jpg',
      'ครูสมศรี_แสนดี/PLC_วงรอบที่3_2569_1.jpg'
    ]);
  });

  it('keeps each file its own format', () => {
    const paths = zipEntryPaths([
      { folder: 'ครู ก', name: 'นิเทศหน้าเดียว_2569', dataUrl: pdf('a') },
      { folder: 'ครู ข', name: 'นิเทศหน้าเดียว_2569', dataUrl: jpeg('b') }
    ]).map(entry => entry.path);

    expect(paths).toEqual([
      'ครู_ก/นิเทศหน้าเดียว_2569.pdf',
      'ครู_ข/นิเทศหน้าเดียว_2569.jpg'
    ]);
  });

  it('numbers a repeated name instead of overwriting it', () => {
    // A teacher can have two supervisions in one academic year.
    const paths = zipEntryPaths([
      { folder: 'ครู ก', name: 'นิเทศหน้าเดียว_2569', dataUrl: jpeg('a') },
      { folder: 'ครู ก', name: 'นิเทศหน้าเดียว_2569', dataUrl: jpeg('b') }
    ]).map(entry => entry.path);

    expect(paths).toEqual([
      'ครู_ก/นิเทศหน้าเดียว_2569.jpg',
      'ครู_ก/นิเทศหน้าเดียว_2569_2.jpg'
    ]);
  });

  it('skips anything that is not a stored file', () => {
    expect(zipEntryPaths([
      { folder: 'ครู ก', name: 'x', dataUrl: 'https://example.com/x.jpg' },
      null,
      { folder: 'ครู ก', name: 'y', dataUrl: jpeg('a') }
    ]).map(e => e.path)).toEqual(['ครู_ก/y.jpg']);
    expect(zipEntryPaths([])).toEqual([]);
  });
});

describe('buildZipBlob', () => {
  it('builds a zip holding every file at its folder path', async () => {
    const blob = await buildZipBlob([
      { folder: 'ครู ก', name: 'ภาพ_1', dataUrl: jpeg('one') },
      { folder: 'ครู ข', name: 'ภาพ_1', dataUrl: jpeg('two') }
    ]);

    const { default: JSZip } = await import('jszip');
    const read = await JSZip.loadAsync(await blob.arrayBuffer());

    // Real folders in the archive, one per teacher, each holding their files.
    const folders = Object.values(read.files).filter(f => f.dir).map(f => f.name).sort();
    const files = Object.values(read.files).filter(f => !f.dir).map(f => f.name).sort();
    expect(folders).toEqual(['ครู_ก/', 'ครู_ข/']);
    expect(files).toEqual(['ครู_ก/ภาพ_1.jpg', 'ครู_ข/ภาพ_1.jpg']);
    expect(await read.file('ครู_ก/ภาพ_1.jpg').async('string')).toBe('one');
  });

  it('returns nothing when there is nothing to pack', async () => {
    expect(await buildZipBlob([])).toBeNull();
  });
});
