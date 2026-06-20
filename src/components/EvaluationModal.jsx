import React, { useState, useEffect } from 'react';

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
    }
  }, [supervision, currentUser]);

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
        studentBehavior: studentBehavior.trim()
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
