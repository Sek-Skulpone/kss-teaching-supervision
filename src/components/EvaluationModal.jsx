import React, { useState, useEffect } from 'react';
import { Camera, Upload, X } from 'lucide-react';

const OBSERVATION_ITEMS = [
  { id: '1_1', no: '1.1', label: 'มีแผนการจัดการเรียนรู้ที่ใช้ประกอบการเรียนการสอน', group: '1. แผนการจัดการเรียนรู้' },
  { id: '1_2', no: '1.2', label: 'การกำหนดจุดประสงค์การเรียนรู้ตามตัวชี้วัดตามหลักสูตร / ผลการเรียนรู้', group: '1. แผนการจัดการเรียนรู้' },
  { id: '1_3', no: '1.3', label: 'กำหนดความรู้ที่คงทน/ผลของการจัดการเรียนการสอน', group: '1. แผนการจัดการเรียนรู้' },
  { id: '1_4', no: '1.4', label: 'การดำเนินกิจกรรมการเรียนการสอนที่สอดคล้องกับหลักสูตรและธรรมชาติของวิชา', group: '1. แผนการจัดการเรียนรู้' },
  { id: '1_5', no: '1.5', label: 'การกำหนดสื่อประกอบการสอนและแหล่งเรียนรู้', group: '1. แผนการจัดการเรียนรู้' },
  { id: '1_6', no: '1.6', label: 'การกำหนดวิธีการวัดประเมินผล', group: '1. แผนการจัดการเรียนรู้' },
  { id: '2', no: '2', label: 'ลำดับขั้นตอนการจัดกิจกรรมการเรียนการสอน (นำเข้าสู่บทเรียน ขั้นสอน ขั้นสรุปผล)' },
  { id: '3', no: '3', label: 'การจัดการเรียนการสอนที่เน้นผู้เรียนเป็นสำคัญ / นักเรียนมีส่วนร่วมในกิจกรรมการเรียนการสอน' },
  { id: '4', no: '4', label: 'กิจกรรมพัฒนาคุณภาพผู้เรียนมีการแบ่งกลุ่ม / ส่งเสริมประชาธิปไตย' },
  { id: '5', no: '5', label: 'ความสามารถในการจัดการชั้นเรียน และแก้ปัญหาในชั้นเรียน' },
  { id: '6', no: '6', label: 'มีการเสริมแรงตามความเหมาะสม' },
  { id: '7', no: '7', label: 'ผู้เรียนมีความกระตือรือร้นและสนุกสนานในการเรียน' },
  { id: '8', no: '8', label: 'การใช้สื่อ ประกอบการเรียนการสอน' },
  { id: '9', no: '9', label: 'การใช้สื่อ ICT มาถ่ายทอดเนื้อหา สาระ และออกแบบการเรียนรู้' },
  { id: '10', no: '10', label: 'มีการวัดผลก่อนเรียน และหลังเรียนในแต่ละบทเรียน' },
  { id: '11', no: '11', label: 'การวัดและประเมินผลด้วยวิธีการที่หลากหลายและสอดคล้องกับหลักสูตร และประเมินความรู้ความสามารถของผู้เรียน' },
  { id: '12', no: '12', label: 'มีการกำกับติดตาม นักเรียนที่มีปัญหาหรือไม่เข้าใจในบทเรียน ของรายวิชาที่สอน ดำเนินการช่วยเหลือ/แก้ไข' },
  { id: '13', no: '13', label: 'จัดบรรยากาศการเรียนที่ดึงดูดความสนใจก่อให้เกิดความสุขแก่ผู้เรียน' },
  { id: '14', no: '14', label: 'การบันทึกหลังสอน และการนำผลการบันทึกหลังสอนมาแก้ไข / พัฒนา' }
];

const resizeImage = (file) => {
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
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
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

export default function EvaluationModal({ supervision, currentUser, onClose, onSubmit }) {
  const [ratings, setRatings] = useState(() => {
    const initial = {};
    OBSERVATION_ITEMS.forEach(item => {
      initial[item.id] = { practice: 'มี', score: 4 };
    });
    return initial;
  });

  const [teacherBehavior, setTeacherBehavior] = useState('');
  const [teachingActivity, setTeachingActivity] = useState('');
  const [studentBehavior, setStudentBehavior] = useState('');
  const [images, setImages] = useState([]);
  const [isResizing, setIsResizing] = useState(false);

  // Load existing evaluation data if it exists for this supervisor
  useEffect(() => {
    if (supervision && supervision.evaluations && supervision.evaluations[currentUser.id]) {
      const myEval = supervision.evaluations[currentUser.id];
      if (myEval.ratings) {
        const loadedRatings = {};
        OBSERVATION_ITEMS.forEach(item => {
          if (myEval.ratings[item.id]) {
            loadedRatings[item.id] = {
              practice: myEval.ratings[item.id].practice ?? 'มี',
              score: myEval.ratings[item.id].score ?? 4
            };
          } else {
            // Keep compatibility
            loadedRatings[item.id] = { practice: 'มี', score: 4 };
          }
        });
        setRatings(loadedRatings);
      }
      setTeacherBehavior(myEval.teacherBehavior ?? '');
      setTeachingActivity(myEval.teachingActivity ?? '');
      setStudentBehavior(myEval.studentBehavior ?? '');
      setImages(myEval.images ?? []);
    }
  }, [supervision, currentUser]);

  const handleImageChange = async (e) => {
    const files = Array.from(e.target.files);
    if (!files || files.length === 0) return;

    if (images.length + files.length > 4) {
      alert('สามารถอัปโหลดรูปภาพได้สูงสุด 4 รูปเท่านั้นครับ');
      return;
    }

    setIsResizing(true);
    try {
      const resizedDataUrls = await Promise.all(
        files.map(file => resizeImage(file))
      );
      setImages(prev => [...prev, ...resizedDataUrls]);
    } catch (err) {
      console.error('Error processing images:', err);
      alert('เกิดข้อผิดพลาดในการประมวลผลรูปภาพ');
    } finally {
      setIsResizing(false);
      e.target.value = '';
    }
  };

  const removeImage = (indexToRemove) => {
    setImages(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();

    const formattedRatings = {};
    OBSERVATION_ITEMS.forEach(item => {
      const r = ratings[item.id];
      formattedRatings[item.id] = {
        practice: r.practice,
        score: r.practice === 'มี' ? Number(r.score) : 0
      };
    });

    const newEvaluations = {
      ...(supervision.evaluations || {}),
      [currentUser.id]: {
        supervisorId: currentUser.id,
        supervisorName: currentUser.name,
        submittedAt: new Date().toISOString(),
        ratings: formattedRatings,
        teacherBehavior: teacherBehavior.trim(),
        teachingActivity: teachingActivity.trim(),
        studentBehavior: studentBehavior.trim(),
        images: images
      }
    };

    onSubmit(newEvaluations);
  };

  const handlePracticeChange = (itemId, practice) => {
    setRatings(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        practice,
        score: practice === 'มี' ? 4 : 0
      }
    }));
  };

  const handleScoreChange = (itemId, score) => {
    setRatings(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        score
      }
    }));
  };

  const formatThaiDate = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const yearTh = parseInt(parts[0]) + 543;
    const monthIndex = parseInt(parts[1]) - 1;
    const day = parseInt(parts[2]);
    const monthsShort = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    return `${day} ${monthsShort[monthIndex]} ${yearTh}`;
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '800px', width: '90%' }}>
        <div className="modal-header">
          <h3 style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            <span>บันทึกการนิเทศครูผู้สอนรายบุคคล</span>
            <span style={{ fontSize: '12px', fontWeight: 'normal', color: 'var(--text-medium)' }}>
              โรงเรียนโคกสีวิทยาสรรค์ สำนักงานเขตพื้นที่การศึกษามัธยมศึกษาสกลนคร
            </span>
          </h3>
          <button type="button" className="modal-close-btn" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleFormSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxHeight: '70vh', overflowY: 'auto' }}>
            <div style={{ backgroundColor: '#f8f9fa', padding: '0.8rem', borderRadius: 'var(--radius-sm)', fontSize: '13px', borderLeft: '4px solid var(--primary-color)' }}>
              <div><strong>ชื่อผู้รับการนิเทศ:</strong> {supervision.teacherName}</div>
              <div><strong>วิชา:</strong> {supervision.subject} (ชั้น ม.{supervision.grade.replace('ม.', '')}/{supervision.room})</div>
              <div><strong>วัน-เวลาคาบนิเทศ:</strong> {formatThaiDate(supervision.date)} เวลา {supervision.time}</div>
              <div><strong>ชื่อผู้นิเทศ (คุณ):</strong> {currentUser.name}</div>
            </div>

            <div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', marginBottom: '1rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '2px solid #cbd5e1' }}>
                    <th style={{ padding: '0.6rem 0.4rem', textAlign: 'center', width: '40px' }}>ที่</th>
                    <th style={{ padding: '0.6rem 0.4rem', textAlign: 'left' }}>รายการนิเทศ</th>
                    <th style={{ padding: '0.6rem 0.4rem', textAlign: 'center', width: '110px' }}>การปฏิบัติ</th>
                    <th style={{ padding: '0.6rem 0.4rem', textAlign: 'center', width: '160px' }}>ผลการปฏิบัติ</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Group header if item is 1.1 */}
                  {OBSERVATION_ITEMS.map((item, idx) => {
                    const isFirstGroupItem = item.id === '1_1';
                    const showGroupHeader = isFirstGroupItem;
                    
                    return (
                      <React.Fragment key={item.id}>
                        {showGroupHeader && (
                          <tr style={{ backgroundColor: '#f8fafc', fontWeight: 'bold' }}>
                            <td style={{ padding: '0.5rem 0.4rem', textAlign: 'center' }}>1</td>
                            <td style={{ padding: '0.5rem 0.4rem' }} colSpan={3}>{item.group}</td>
                          </tr>
                        )}
                        <tr style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: item.group ? '#fff' : '#fff' }}>
                          <td style={{ padding: '0.5rem 0.4rem', textAlign: 'center', color: 'var(--text-medium)', fontWeight: 500 }}>
                            {item.no}
                          </td>
                          <td style={{ padding: '0.5rem 0.4rem', paddingLeft: item.group ? '1.5rem' : '0.4rem', color: 'var(--text-dark)' }}>
                            {item.label}
                          </td>
                          <td style={{ padding: '0.5rem 0.4rem', textAlign: 'center' }}>
                            <div style={{ display: 'inline-flex', gap: '2px', backgroundColor: '#f1f5f9', padding: '2px', borderRadius: '4px' }}>
                              {['มี', 'ไม่มี'].map(opt => (
                                <button
                                  key={opt}
                                  type="button"
                                  onClick={() => handlePracticeChange(item.id, opt)}
                                  style={{
                                    padding: '0.2rem 0.4rem',
                                    fontSize: '11px',
                                    fontWeight: '600',
                                    border: 'none',
                                    borderRadius: '3px',
                                    cursor: 'pointer',
                                    backgroundColor: ratings[item.id]?.practice === opt ? 'var(--primary-color)' : 'transparent',
                                    color: ratings[item.id]?.practice === opt ? 'white' : 'var(--text-medium)',
                                    transition: 'all 0.15s'
                                  }}
                                >
                                  {opt}
                                </button>
                              ))}
                            </div>
                          </td>
                          <td style={{ padding: '0.5rem 0.4rem', textAlign: 'center' }}>
                            {ratings[item.id]?.practice === 'มี' ? (
                              <div style={{ display: 'inline-flex', gap: '3px' }}>
                                {[
                                  { label: 'ดีมาก', val: 4 },
                                  { label: 'ดี', val: 3 },
                                  { label: 'พอใช้', val: 2 },
                                  { label: 'ปรับปรุง', val: 1 }
                                ].map(scoreOpt => (
                                  <button
                                    key={scoreOpt.val}
                                    type="button"
                                    onClick={() => handleScoreChange(item.id, scoreOpt.val)}
                                    title={scoreOpt.label}
                                    style={{
                                      width: '26px',
                                      height: '26px',
                                      borderRadius: '50%',
                                      border: '1px solid #cbd5e1',
                                      cursor: 'pointer',
                                      fontSize: '10px',
                                      fontWeight: 'bold',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      backgroundColor: ratings[item.id]?.score === scoreOpt.val ? 'var(--primary-color)' : 'white',
                                      color: ratings[item.id]?.score === scoreOpt.val ? 'white' : 'var(--text-dark)',
                                      transition: 'all 0.1s'
                                    }}
                                  >
                                    {scoreOpt.val}
                                  </button>
                                ))}
                              </div>
                            ) : (
                              <span style={{ fontSize: '11px', color: 'var(--text-light)', fontStyle: 'italic' }}>- ไม่ปฏิบัติ -</span>
                            )}
                          </td>
                        </tr>
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
              <h4 style={{ fontWeight: 700, fontSize: '14px', color: 'var(--primary-color)', marginBottom: '0.75rem' }}>
                ข้อเสนอแนะของผู้นิเทศ
              </h4>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ fontWeight: 600, fontSize: '13px' }}>1. พฤติกรรมครู</label>
                <textarea
                  rows="3"
                  value={teacherBehavior}
                  onChange={(e) => setTeacherBehavior(e.target.value)}
                  placeholder="ระบุข้อสังเกตเกี่ยวกับพฤติกรรมครูผู้สอน..."
                  required
                ></textarea>
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ fontWeight: 600, fontSize: '13px' }}>2. การจัดกิจกรรมการเรียนการสอน</label>
                <textarea
                  rows="3"
                  value={teachingActivity}
                  onChange={(e) => setTeachingActivity(e.target.value)}
                  placeholder="ระบุข้อสังเกตเกี่ยวกับการดำเนินกิจกรรมการสอน การเรียนรู้เชิงรุก..."
                  required
                ></textarea>
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ fontWeight: 600, fontSize: '13px' }}>3. พฤติกรรมนักเรียน</label>
                <textarea
                  rows="3"
                  value={studentBehavior}
                  onChange={(e) => setStudentBehavior(e.target.value)}
                  placeholder="ระบุข้อสังเกตเกี่ยวกับพฤติกรรมผู้เรียน การมีส่วนร่วม การเข้าถึงบทเรียน..."
                  required
                ></textarea>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '1rem' }}>
              <h4 style={{ fontWeight: 700, fontSize: '14px', color: 'var(--primary-color)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Camera size={16} /> รูปภาพประกอบการนิเทศ (สูงสุด 4 รูป)
              </h4>
              
              <style>{`
                @keyframes spin {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
              `}</style>

              {/* Image Previews */}
              {images.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
                  {images.map((imgUrl, index) => (
                    <div key={index} style={{ position: 'relative', width: '100%', aspectRatio: '4/3', borderRadius: '6px', overflow: 'hidden', border: '1px solid #cbd5e1', boxShadow: 'var(--shadow-sm)' }}>
                      <img 
                        src={imgUrl} 
                        alt={`Supervision upload ${index + 1}`} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        style={{
                          position: 'absolute',
                          top: '4px',
                          right: '4px',
                          backgroundColor: 'rgba(231, 76, 60, 0.9)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '50%',
                          width: '24px',
                          height: '24px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                          transition: 'background-color 0.2s',
                          padding: 0
                        }}
                        title="ลบรูปภาพ"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload Button area */}
              {images.length < 4 ? (
                <div style={{ position: 'relative' }}>
                  <input
                    type="file"
                    id="supervision-image-upload"
                    multiple
                    accept="image/*"
                    onChange={handleImageChange}
                    style={{ display: 'none' }}
                    disabled={isResizing}
                  />
                  <label
                    htmlFor="supervision-image-upload"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '1.5rem',
                      border: '2px dashed #cbd5e1',
                      borderRadius: '8px',
                      cursor: isResizing ? 'not-allowed' : 'pointer',
                      backgroundColor: '#fafafa',
                      transition: 'all 0.25s',
                      textAlign: 'center'
                    }}
                    onMouseEnter={(e) => {
                      if (!isResizing) {
                        e.currentTarget.style.borderColor = 'var(--primary-color)';
                        e.currentTarget.style.backgroundColor = '#f0fdf4';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isResizing) {
                        e.currentTarget.style.borderColor = '#cbd5e1';
                        e.currentTarget.style.backgroundColor = '#fafafa';
                      }
                    }}
                  >
                    {isResizing ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                        <div className="spinner" style={{
                          width: '24px',
                          height: '24px',
                          border: '3px solid #f3f3f3',
                          borderTop: '3px solid var(--primary-color)',
                          borderRadius: '50%',
                          animation: 'spin 1s linear infinite'
                        }}></div>
                        <span style={{ fontSize: '13px', color: 'var(--text-medium)', fontWeight: 500 }}>กำลังย่อขนาดและประมวลผลรูปภาพ...</span>
                      </div>
                    ) : (
                      <>
                        <Upload size={24} style={{ color: 'var(--primary-color)', marginBottom: '0.5rem' }} />
                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-dark)' }}>
                          คลิกเพื่อเลือกไฟล์รูปภาพ
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--text-medium)', marginTop: '0.2rem' }}>
                          (เลือกพร้อมกันได้หลายรูป สูงสุด 4 รูป, อัปโหลดแล้ว {images.length}/4 รูป)
                        </span>
                      </>
                    )}
                  </label>
                </div>
              ) : (
                <div style={{ padding: '1rem', backgroundColor: '#f0fdf4', border: '1px solid #b2f5ea', borderRadius: '6px', textAlign: 'center', color: 'var(--primary-color)', fontSize: '13px', fontWeight: 600 }}>
                  ✓ อัปโหลดครบ 4 รูปแล้ว (หากต้องการแก้ไข ให้กดปุ่มลบสีแดงที่มุมขวาบนของรูปเพื่อเพิ่มใหม่)
                </div>
              )}
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>ยกเลิก</button>
            <button type="submit" className="btn btn-primary">บันทึกผลการประเมิน</button>
          </div>
        </form>
      </div>
    </div>
  );
}
