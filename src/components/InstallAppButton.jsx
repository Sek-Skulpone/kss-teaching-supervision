import { useState, useEffect } from 'react';
import { Download } from 'lucide-react';

const isIos = () => /iphone|ipad|ipod/i.test(window.navigator.userAgent);

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

// Shows an "install to home screen" button on mobile/tablet only (hidden on
// desktop via CSS). Android/Chrome gets a real native install prompt; iOS
// Safari has no such API, so it gets short instructions instead since the
// "Add to Home Screen" step there can only be done manually via the share menu.
export default function InstallAppButton() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [installed, setInstalled] = useState(isStandalone());
  const [showIosHint, setShowIosHint] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    const handleAppInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  if (installed) return null;
  if (!deferredPrompt && !isIos()) return null;

  const handleClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') setInstalled(true);
      setDeferredPrompt(null);
      return;
    }
    if (isIos()) {
      setShowIosHint(true);
    }
  };

  return (
    <div className="install-app-wrapper">
      <button type="button" className="btn btn-outline install-app-btn" onClick={handleClick}>
        <Download size={16} />
        เพิ่มไปยังหน้าจอหลัก
      </button>

      {showIosHint && (
        <div className="modal-overlay" onClick={() => setShowIosHint(false)}>
          <div className="modal-content" style={{ maxWidth: '360px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>เพิ่มไปยังหน้าจอหลัก</h3>
              <button className="modal-close-btn" aria-label="ปิดหน้าต่าง" onClick={() => setShowIosHint(false)}>×</button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: '0.5rem' }}>บน Safari:</p>
              <ol style={{ paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <li>แตะปุ่มแชร์ 🔼 ที่แถบด้านล่าง (หรือด้านบน)</li>
                <li>เลื่อนลงแล้วเลือก "เพิ่มไปยังหน้าจอโฮม" (Add to Home Screen)</li>
                <li>แตะ "เพิ่ม" มุมขวาบน</li>
              </ol>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
