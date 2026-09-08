// Saves photos to the device as separate files, exactly as they are stored
// -- no re-encoding, so what lands on disk is the picture the app holds.

const EXTENSION_BY_MIME = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif'
};

// Windows and macOS both reject these in file names, and Thai text is fine
// to keep as-is.
const safeFileName = (name) =>
  String(name || 'ภาพ').replace(/[\\/:*?"<>|]+/g, '').replace(/\s+/g, '_').slice(0, 80);

const dataUrlToBlob = (dataUrl) => {
  const [header, base64] = dataUrl.split(',');
  const matched = header.match(/data:([^;]+)/);
  const mime = matched ? matched[1] : 'image/jpeg';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return { blob: new Blob([bytes], { type: mime }), extension: EXTENSION_BY_MIME[mime] || 'jpg' };
};

/**
 * Downloads every photo in `images` as `<baseName>_1.jpg`, `<baseName>_2.jpg`...
 * Returns how many were saved.
 *
 * The files are saved one at a time with a short gap: browsers treat a burst
 * of downloads from one click as suspicious, and Chrome only asks its
 * "allow multiple downloads?" question -- and then honours it -- when they
 * don't all arrive in the same tick.
 */
export const downloadImages = async (images, baseName) => {
  const list = (images || []).filter(img => typeof img === 'string' && img.startsWith('data:'));
  if (list.length === 0) return 0;

  const prefix = safeFileName(baseName);
  const objectUrls = [];

  for (let i = 0; i < list.length; i++) {
    const { blob, extension } = dataUrlToBlob(list[i]);
    const url = URL.createObjectURL(blob);
    objectUrls.push(url);

    const link = document.createElement('a');
    link.href = url;
    link.download = `${prefix}_${i + 1}.${extension}`;
    document.body.appendChild(link);
    link.click();
    link.remove();

    if (i < list.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }

  // Freed once the browser has had time to start every download.
  setTimeout(() => objectUrls.forEach(url => URL.revokeObjectURL(url)), 60000);
  return list.length;
};
