// Saves photos to the device as separate files, exactly as they are stored
// -- no re-encoding, so what lands on disk is the picture the app holds.

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

const dataUrlToBlob = (dataUrl) => {
  const { base64, mime, extension } = parseDataUrl(dataUrl);
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return { blob: new Blob([bytes], { type: mime }), extension };
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

/**
 * Saves `files` ([{ dataUrl, name }], name without an extension) to the
 * device, one file each. Returns how many were saved.
 *
 * They go out one at a time with a short gap: browsers treat a burst of
 * downloads from one click as suspicious, and Chrome only asks its "allow
 * multiple downloads?" question -- and then honours it -- when they don't
 * all arrive in the same tick.
 */
export const downloadFiles = async (files) => {
  const list = (files || []).filter(file => file && isStoredFile(file.dataUrl));
  if (list.length === 0) return 0;

  for (let i = 0; i < list.length; i++) {
    const { blob, extension } = dataUrlToBlob(list[i].dataUrl);
    saveBlob(blob, `${safeFileName(list[i].name)}.${extension}`);

    if (i < list.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }
  return list.length;
};

/** Saves photos as `<baseName>_1.jpg`, `<baseName>_2.jpg`... */
export const downloadImages = async (images, baseName) =>
  downloadFiles(imageFiles(images, baseName));

/** Names a set of photos without saving them, for callers batching several. */
export const imageFiles = (images, baseName, startAt = 1) =>
  (images || [])
    .filter(isStoredFile)
    .map((dataUrl, i) => ({ dataUrl, name: `${baseName}_${startAt + i}` }));
