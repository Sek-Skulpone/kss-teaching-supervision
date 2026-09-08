// Naming and saving for the files this app hands back to the user. Photos
// and attachments are stored as base64 `data:` URLs, and everything here
// passes them through as they are -- no re-encoding, so what lands on disk
// is exactly the file the app holds.

const EXTENSION_BY_MIME = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'application/pdf': 'pdf'
};

// Windows and macOS both reject these in file names, and Thai text is fine
// to keep as-is. One path segment at a time -- "/" is a separator between
// names, never part of one.
export const safeFileName = (name) =>
  String(name || 'ภาพ').replace(/[\\/:*?"<>|]+/g, '').replace(/\s+/g, '_').slice(0, 80);

export const isStoredFile = (dataUrl) => typeof dataUrl === 'string' && dataUrl.startsWith('data:');

/** Splits a stored `data:` URL into the parts a file needs. */
export const parseDataUrl = (dataUrl) => {
  const [header, base64] = dataUrl.split(',');
  const matched = header.match(/data:([^;]+)/);
  const mime = matched ? matched[1] : 'image/jpeg';
  return { base64, mime, extension: EXTENSION_BY_MIME[mime] || 'jpg' };
};

/** Hands one finished blob to the browser to save. */
export const saveBlob = (blob, fileName) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Freed once the browser has had time to start the download.
  setTimeout(() => URL.revokeObjectURL(url), 60000);
};

/** Names a set of photos as `<baseName>_1`, `<baseName>_2`... */
export const imageFiles = (images, baseName, startAt = 1) =>
  (images || [])
    .filter(isStoredFile)
    .map((dataUrl, i) => ({ dataUrl, name: `${baseName}_${startAt + i}` }));
