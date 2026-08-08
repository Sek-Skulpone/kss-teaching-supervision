// Client-side image compressor used before storing photos as base64 data
// URLs. These are stored inside Firestore documents, which cap at 1 MiB, so
// uploads are downscaled and re-encoded as JPEG first. Resizes to fit within
// maxWidth x maxHeight while preserving aspect ratio.
//
// Defaults are tuned for the PLC / evaluation documentation photos that make
// up the bulk of stored data: 700px @ 0.5 measures ~47KB per photo versus
// ~104KB at the previous 800px @ 0.7, i.e. roughly half the storage and
// transfer for images that are only ever viewed on a phone or in a modal.
// Callers wanting a different trade-off (e.g. avatars) pass explicit values.
export const resizeImage = (file, { maxWidth = 700, maxHeight = 700, quality = 0.5 } = {}) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = (err) => {
        reject(err);
      };
    };
    reader.onerror = (err) => {
      reject(err);
    };
  });
};
