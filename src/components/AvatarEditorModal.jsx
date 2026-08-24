import { useState, useRef } from 'react';
import { Upload, Trash2, Move } from 'lucide-react';
import { resizeImage } from '../utils/imageResize';

const DEFAULT_POSITION = { x: 50, y: 50 };

const parsePosition = (positionStr) => {
  if (!positionStr) return DEFAULT_POSITION;
  const [x, y] = positionStr.split(' ').map(v => parseFloat(v));
  if (Number.isNaN(x) || Number.isNaN(y)) return DEFAULT_POSITION;
  return { x, y };
};

// Shared avatar upload / drag-to-reposition / delete modal. Used both for a
// user's own avatar (App.jsx navbar) and by an admin editing a teacher's
// avatar (AdminDashboard's edit-teacher form) -- same component, different
// save/delete callbacks wired in by the caller.
export default function AvatarEditorModal({ currentImage, currentPosition, onSave, onDelete, onClose, title = 'รูปประจำตัว' }) {
  const [pendingImage, setPendingImage] = useState(null);
  const [position, setPosition] = useState(() => parsePosition(currentPosition));
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const dragState = useRef(null);
  const boxRef = useRef(null);

  const displayImage = pendingImage || currentImage;

  const handleFileSelect = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('กรุณาเลือกไฟล์รูปภาพเท่านั้น');
      return;
    }
    try {
      // Downscale but don't force-crop to square here -- object-position
      // dragging below lets the user choose which part shows.
      //
      // Kept small deliberately: every teacher's avatar lives in the single
      // shared `teachers` document that loads on EVERY page view, so this
      // size is paid by everyone on every visit. 200px still renders sharp
      // at the 56px (navbar) and 44px (table) sizes these are shown at,
      // even on a 3x display.
      const dataUrl = await resizeImage(file, { maxWidth: 200, maxHeight: 200, quality: 0.7 });
      setPendingImage(dataUrl);
      setPosition(DEFAULT_POSITION);
    } catch (err) {
      console.error('Error reading avatar file:', err);
      alert('ไม่สามารถอ่านไฟล์รูปภาพได้ กรุณาลองใหม่อีกครั้ง');
    }
  };

  const clampPercent = (v) => Math.min(100, Math.max(0, v));

  const startDrag = (clientX, clientY) => {
    if (!displayImage) return;
    dragState.current = { startX: clientX, startY: clientY, startPos: position };
  };

  const moveDrag = (clientX, clientY) => {
    if (!dragState.current || !boxRef.current) return;
    const rect = boxRef.current.getBoundingClientRect();
    const dxPercent = ((clientX - dragState.current.startX) / rect.width) * 100;
    const dyPercent = ((clientY - dragState.current.startY) / rect.height) * 100;
    // Dragging the image right should reveal more of its left side, i.e.
    // object-position decreases as the pointer moves right.
    setPosition({
      x: clampPercent(dragState.current.startPos.x - dxPercent),
      y: clampPercent(dragState.current.startPos.y - dyPercent)
    });
  };

  const endDrag = () => {
    dragState.current = null;
  };

  const handleSave = async () => {
    if (!displayImage) return;
    setIsSaving(true);
    try {
      const success = await onSave(displayImage, `${position.x}% ${position.y}%`);
      if (success) {
        onClose();
      } else {
        alert('เกิดข้อผิดพลาดในการบันทึกรูปภาพ กรุณาลองใหม่อีกครั้ง');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('ต้องการลบรูปประจำตัวนี้ใช่หรือไม่?')) return;
    setIsDeleting(true);
    try {
      const success = await onDelete();
      if (success) {
        onClose();
      } else {
        alert('เกิดข้อผิดพลาดในการลบรูปภาพ กรุณาลองใหม่อีกครั้ง');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '380px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="modal-close-btn" aria-label="ปิดหน้าต่าง" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div
            ref={boxRef}
            className="avatar-editor-box"
            onMouseDown={(e) => { e.preventDefault(); startDrag(e.clientX, e.clientY); }}
            onMouseMove={(e) => moveDrag(e.clientX, e.clientY)}
            onMouseUp={endDrag}
            onMouseLeave={endDrag}
            onTouchStart={(e) => { const t = e.touches[0]; startDrag(t.clientX, t.clientY); }}
            onTouchMove={(e) => { const t = e.touches[0]; moveDrag(t.clientX, t.clientY); }}
            onTouchEnd={endDrag}
          >
            {displayImage ? (
              <img
                src={displayImage}
                alt="ตัวอย่างรูปประจำตัว"
                className="avatar-editor-img"
                style={{ objectPosition: `${position.x}% ${position.y}%` }}
                draggable={false}
              />
            ) : (
              <div className="avatar-editor-placeholder">ยังไม่มีรูปประจำตัว</div>
            )}
          </div>

          {displayImage && (
            <p style={{ fontSize: '12px', color: 'var(--text-medium)', textAlign: 'center', marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
              <Move size={12} /> ลากรูปเพื่อปรับตำแหน่ง
            </p>
          )}

          <label className="btn btn-outline" style={{ width: '100%', marginTop: '0.75rem', cursor: 'pointer', display: 'flex', justifyContent: 'center', gap: '0.4rem' }}>
            <Upload size={14} />
            {currentImage || pendingImage ? 'เลือกรูปใหม่' : 'เลือกรูปภาพ'}
            <input type="file" accept="image/*" onChange={handleFileSelect} style={{ display: 'none' }} />
          </label>
        </div>
        <div className="modal-footer">
          {currentImage && !pendingImage && (
            <button
              type="button"
              className="btn btn-outline"
              style={{ color: '#e74c3c', borderColor: '#e74c3c', marginRight: 'auto' }}
              onClick={handleDelete}
              disabled={isDeleting || isSaving}
            >
              <Trash2 size={14} style={{ marginRight: '0.3rem' }} />
              {isDeleting ? 'กำลังลบ...' : 'ลบรูปนี้'}
            </button>
          )}
          <button type="button" className="btn btn-outline" onClick={onClose}>ยกเลิก</button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSave}
            disabled={!displayImage || isSaving || isDeleting}
          >
            {isSaving ? 'กำลังบันทึก...' : 'บันทึก'}
          </button>
        </div>
      </div>
    </div>
  );
}
