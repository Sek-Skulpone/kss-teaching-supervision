import { getOnePageReportFile } from '../db';

// Turns a base64 data URL into a blob: URL. Chrome refuses to open a data:
// URL as a top-level document, so PDFs have to be handed over as a blob.
const dataUrlToBlobUrl = (dataUrl) => {
  const [header, base64] = dataUrl.split(',');
  const matched = header.match(/data:([^;]+)/);
  const mime = matched ? matched[1] : 'application/octet-stream';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return URL.createObjectURL(new Blob([bytes], { type: mime }));
};

// Opens a supervision's One-Page report.
//
// The file lives in its own Firestore document (see db.js), so it has to be
// fetched before it can be shown -- `showImage` receives the data URL for
// image reports, PDFs open in a new tab, and links open straight away.
export const openOnePageReport = async (supervision, showImage) => {
  const report = supervision && supervision.onePageReport;
  if (!report) return;

  if (report.type === 'link') {
    window.open(report.fileUrl, '_blank');
    return;
  }

  // Opened up front, while the click that triggered this is still the
  // "user gesture" the browser trusts; a window.open() after the await
  // below would be swallowed by the popup blocker.
  const pendingTab = report.type === 'image' ? null : window.open('', '_blank');

  try {
    const fileData = await getOnePageReportFile(supervision);
    if (!fileData) throw new Error('One-Page report file not found');

    if (report.type === 'image') {
      showImage(fileData);
      return;
    }

    const blobUrl = dataUrlToBlobUrl(fileData);
    if (pendingTab) {
      pendingTab.location.href = blobUrl;
    } else {
      window.open(blobUrl, '_blank');
    }
  } catch (e) {
    if (pendingTab) pendingTab.close();
    console.error('Failed to open the One-Page report:', e);
    alert('ไม่สามารถเปิดไฟล์รายงานนิเทศหน้าเดียวได้ กรุณาลองใหม่อีกครั้ง');
  }
};
