import { safeFileName, parseDataUrl, isStoredFile, saveBlob } from './downloadImages';

// A whole academic year comes to ~130 photos, which is unusable as 130
// separate downloads, so the year-wide exports build one ZIP with a folder
// per teacher instead.

/**
 * Lays out `entries` ([{ folder, name, dataUrl }]) as ZIP paths.
 * Two files that would land on the same path inside a folder get numbered
 * rather than silently overwriting each other -- a teacher can have more
 * than one supervision in a year.
 */
export const zipEntryPaths = (entries) => {
  const taken = new Map();

  return (entries || [])
    .filter(entry => entry && isStoredFile(entry.dataUrl))
    .map(entry => {
      const { extension } = parseDataUrl(entry.dataUrl);
      const folder = safeFileName(entry.folder);
      const base = `${folder}/${safeFileName(entry.name)}`;

      const seen = taken.get(base) || 0;
      taken.set(base, seen + 1);
      const path = seen === 0 ? `${base}.${extension}` : `${base}_${seen + 1}.${extension}`;

      return { path, dataUrl: entry.dataUrl };
    });
};

/**
 * Builds the ZIP. `onProgress` is called with 0-100 while it is being put
 * together. Photos and PDFs are already compressed, so the files are stored
 * as they are -- deflating them again costs seconds and saves nothing.
 */
export const buildZipBlob = async (entries, onProgress) => {
  const paths = zipEntryPaths(entries);
  if (paths.length === 0) return null;

  const { default: JSZip } = await import('jszip');
  const zip = new JSZip();
  paths.forEach(({ path, dataUrl }) => {
    zip.file(path, parseDataUrl(dataUrl).base64, { base64: true });
  });

  return zip.generateAsync(
    { type: 'blob', compression: 'STORE' },
    meta => { if (onProgress) onProgress(Math.round(meta.percent)); }
  );
};

/** Builds the ZIP and saves it. Returns how many files it holds. */
export const downloadZip = async (entries, zipName, onProgress) => {
  const paths = zipEntryPaths(entries);
  if (paths.length === 0) return 0;

  const blob = await buildZipBlob(entries, onProgress);
  saveBlob(blob, `${safeFileName(zipName)}.zip`);
  return paths.length;
};
