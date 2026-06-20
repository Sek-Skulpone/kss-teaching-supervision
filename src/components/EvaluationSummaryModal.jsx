import React from 'react';

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

export default function EvaluationSummaryModal({ supervision, onClose }) {
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

  const getAverageEvalData = (sup) => {
    if (!sup || !sup.evaluations || Object.keys(sup.evaluations).length === 0) {
      return null;
    }
    const evals = Object.values(sup.evaluations);
    const count = evals.length;

    const itemStats = {};
    OBSERVATION_ITEMS.forEach(item => {
      let sum = 0;
      let practiceCount = 0;
      evals.forEach(ev => {
        // Handle migration if needed
        const r = ev.ratings?.[item.id];
        if (r && r.practice === 'มี') {
          sum += r.score || 0;
          practiceCount++;
        }
      });
      itemStats[item.id] = {
        practiceRate: ((practiceCount / count) * 100).toFixed(0),
        avgScore: practiceCount > 0 ? (sum / practiceCount).toFixed(2) : '-'
      };
    });

    let overallSum = 0;
    let overallCount = 0;
    OBSERVATION_ITEMS.forEach(item => {
      const stats = itemStats[item.id];
      if (stats.avgScore !== '-') {
        overallSum += Number(stats.avgScore);
        overallCount++;
      }
    });

    const overallAvg = overallCount > 0 ? (overallSum / overallCount).toFixed(2) : '-';

    return {
      count,
      itemStats,
      overall: overallAvg,
      evalsList: evals
    };
  };

  const avgData = getAverageEvalData(supervision);

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '750px', width: '90%' }}>
        <div className="modal-header">
          <h3 style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            <span>รายงานสรุปผลการนิเทศการเรียนการสอนรายบุคคล</span>
            <span style={{ fontSize: '12px', fontWeight: 'normal', color: 'var(--text-medium)' }}>
              ดึงข้อมูลรายงานวิเคราะห์และคิดคะแนนเฉลี่ยรวมระบบออนไลน์
            </span>
          </h3>
          <button type="button" className="modal-close-btn" onClick={onClose}>×</button>
        </div>
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxHeight: '70vh', overflowY: 'auto' }}>
          
          {/* General Info */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', backgroundColor: '#f8f9fa', padding: '0.8rem', borderRadius: 'var(--radius-sm)', fontSize: '13px', borderLeft: '4px solid var(--primary-color)' }}>
            <div><strong>ครูผู้สอน:</strong> {supervision.teacherName}</div>
            <div><strong>วิชา:</strong> {supervision.subject} (ชั้น ม.{supervision.grade.replace('ม.', '')}/{supervision.room})</div>
            <div><strong>วัน-เวลาที่นิเทศ:</strong> {formatThaiDate(supervision.date)} เวลา {supervision.time}</div>
            <div><strong>คณะกรรมการนิเทศ:</strong> {supervision.supervisors ? supervision.supervisors.map(s => s.name).join(', ') : 'ยังไม่แต่งตั้ง'}</div>
          </div>

          {!avgData ? (
            <div style={{ textAlign: 'center', padding: '2rem', border: '1px dashed var(--border-color)', borderRadius: '4px', color: 'var(--text-light)' }}>
              ยังไม่มีผู้นิเทศกรอกข้อมูลการประเมินในระบบ
            </div>
          ) : (
            <>
              {/* Overall Summary Score Card */}
              <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '1rem', alignItems: 'center', backgroundColor: '#f0fdf4', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid #b2f5ea' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--status-approved)' }}>คะแนนเฉลี่ยรวม</div>
                  <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--primary-color)', lineHeight: 1.1 }}>{avgData.overall}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-medium)' }}>เต็ม 4.00 คะแนน</div>
                </div>
                <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <div><strong>ระดับคุณภาพการจัดกิจกรรมการเรียนรู้:</strong></div>
                  <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--primary-color)' }}>
                    {avgData.overall === '-' ? '-' : 
                     Number(avgData.overall) >= 3.50 ? 'ดีมาก (Excellent)' :
                     Number(avgData.overall) >= 2.75 ? 'ดี (Good)' :
                     Number(avgData.overall) >= 2.00 ? 'พอใช้ (Fair)' : 'ปรับปรุง (Need Improvement)'}
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-medium)', marginTop: '0.25rem', borderTop: '1px solid #d4f2e6', paddingTop: '0.25rem' }}>
                    * คำนวณจากแบบประเมินของผู้นิเทศทั้งหมด {avgData.count} ท่าน (คำนวณเฉลี่ยเฉพาะข้อที่มีการปฏิบัติจริง)
                  </div>
                </div>
              </div>

              {/* Detailed Scores Breakdown */}
              <div>
                <h4 style={{ fontWeight: 700, fontSize: '14px', color: 'var(--primary-color)', marginBottom: '0.5rem' }}>คะแนนเฉลี่ยรายข้อการสังเกตชั้นเรียน</h4>
                <div style={{ border: '1px solid var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
                  <table style={{ margin: 0, width: '100%', fontSize: '12px' }}>
                    <thead style={{ backgroundColor: '#f8f9fa' }}>
                      <tr>
                        <th style={{ padding: '0.5rem 0.4rem', textAlign: 'center', width: '50px' }}>ที่</th>
                        <th style={{ padding: '0.5rem 0.4rem', textAlign: 'left' }}>รายการประเมิน</th>
                        <th style={{ padding: '0.5rem 0.4rem', textAlign: 'center', width: '100px' }}>อัตราการปฏิบัติ</th>
                        <th style={{ padding: '0.5rem 0.4rem', textAlign: 'center', width: '90px' }}>คะแนนเฉลี่ย</th>
                      </tr>
                    </thead>
                    <tbody>
                      {OBSERVATION_ITEMS.map((item) => {
                        const isFirstGroupItem = item.id === '1_1';
                        const stats = avgData.itemStats[item.id] || { practiceRate: '0', avgScore: '-' };
                        
                        return (
                          <React.Fragment key={item.id}>
                            {isFirstGroupItem && (
                              <tr style={{ backgroundColor: '#f8fafc', fontWeight: 'bold' }}>
                                <td style={{ padding: '0.4rem', textAlign: 'center' }}>1</td>
                                <td style={{ padding: '0.4rem' }} colSpan={3}>{item.group}</td>
                              </tr>
                            )}
                            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                              <td style={{ padding: '0.4rem', textAlign: 'center', fontWeight: 500, color: 'var(--text-medium)' }}>{item.no}</td>
                              <td style={{ padding: '0.4rem', paddingLeft: item.group ? '1.5rem' : '0.4rem', color: 'var(--text-dark)' }}>{item.label}</td>
                              <td style={{ padding: '0.4rem', textAlign: 'center', color: stats.practiceRate === '100' ? '#27ae60' : '#e67e22', fontWeight: 600 }}>
                                {stats.practiceRate}%
                              </td>
                              <td style={{ padding: '0.4rem', textAlign: 'center', fontWeight: 700, color: stats.avgScore !== '-' ? 'var(--primary-color)' : 'var(--text-light)' }}>
                                {stats.avgScore}
                              </td>
                            </tr>
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Qualitative Comments & Suggestions */}
              <div>
                <h4 style={{ fontWeight: 700, fontSize: '14px', color: 'var(--primary-color)', marginBottom: '0.5rem' }}>
                  ข้อเสนอแนะของคณะกรรมการนิเทศ
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {avgData.evalsList.map((ev) => (
                    <div key={ev.supervisorId} style={{ backgroundColor: '#fafafa', border: '1px solid #eee', padding: '0.75rem', borderRadius: '4px', fontSize: '13px' }}>
                      <div style={{ fontWeight: 700, color: 'var(--primary-color)', borderBottom: '1px dashed #e2e8f0', paddingBottom: '0.25rem', marginBottom: '0.4rem' }}>
                        ✍️ ผู้นิเทศ: {ev.supervisorName}
                      </div>
                      
                      <div style={{ marginBottom: '0.4rem' }}>
                        <strong>1. พฤติกรรมครู:</strong>
                        <div style={{ color: 'var(--text-dark)', marginTop: '0.1rem', whiteSpace: 'pre-wrap' }}>
                          {ev.teacherBehavior || '- ไม่มีระบุ -'}
                        </div>
                      </div>
                      
                      <div style={{ marginBottom: '0.4rem' }}>
                        <strong>2. การจัดกิจกรรมการเรียนการสอน:</strong>
                        <div style={{ color: 'var(--text-dark)', marginTop: '0.1rem', whiteSpace: 'pre-wrap' }}>
                          {ev.teachingActivity || '- ไม่มีระบุ -'}
                        </div>
                      </div>

                      <div>
                        <strong>3. พฤติกรรมนักเรียน:</strong>
                        <div style={{ color: 'var(--text-dark)', marginTop: '0.1rem', whiteSpace: 'pre-wrap' }}>
                          {ev.studentBehavior || '- ไม่มีระบุ -'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Self Reflection Section */}
          {supervision.status === 'completed' && supervision.postTeachingRecord && (
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '0.5rem' }}>
              <h4 style={{ fontWeight: 700, color: 'var(--status-completed)', fontSize: '14px', marginBottom: '0.5rem' }}>
                บันทึกหลังสอนของครูผู้จัดกิจกรรม (Self-Reflection)
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '13px', backgroundColor: '#f0f9ff', padding: '0.8rem', borderRadius: 'var(--radius-sm)', border: '1px solid #d0e8f8' }}>
                <div><strong>1. ผลการจัดการเรียนรู้:</strong> <div style={{ color: 'var(--text-dark)', marginTop: '0.1rem', whiteSpace: 'pre-wrap' }}>{supervision.postTeachingRecord.studentOutcome}</div></div>
                <div><strong>2. ปัญหาและอุปสรรค:</strong> <div style={{ color: 'var(--text-dark)', marginTop: '0.1rem', whiteSpace: 'pre-wrap' }}>{supervision.postTeachingRecord.problems}</div></div>
                <div><strong>3. แนวทางแก้ไขและพัฒนา:</strong> <div style={{ color: 'var(--text-dark)', marginTop: '0.1rem', whiteSpace: 'pre-wrap' }}>{supervision.postTeachingRecord.solutions}</div></div>
              </div>
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-primary" onClick={onClose}>ปิดหน้าต่าง</button>
        </div>
      </div>
    </div>
  );
}
