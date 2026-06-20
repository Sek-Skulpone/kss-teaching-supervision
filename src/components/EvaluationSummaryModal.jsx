import React from 'react';

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

    let sumPrep = 0, sumAct = 0, sumPart = 0, sumMedia = 0, sumAssess = 0;
    let sumChars = Array(8).fill(0);

    evals.forEach(ev => {
      sumPrep += ev.ratings?.prep || 0;
      sumAct += ev.ratings?.act || 0;
      sumPart += ev.ratings?.part || 0;
      sumMedia += ev.ratings?.media || 0;
      sumAssess += ev.ratings?.assess || 0;
      for (let i = 0; i < 8; i++) {
        sumChars[i] += ev.ratings?.[`char${i + 1}`] || 0;
      }
    });

    const avgPrep = (sumPrep / count).toFixed(2);
    const avgAct = (sumAct / count).toFixed(2);
    const avgPart = (sumPart / count).toFixed(2);
    const avgMedia = (sumMedia / count).toFixed(2);
    const avgAssess = (sumAssess / count).toFixed(2);
    const avgSection3 = ((Number(avgPrep) + Number(avgAct) + Number(avgPart) + Number(avgMedia) + Number(avgAssess)) / 5).toFixed(2);

    const avgChars = sumChars.map(sum => (sum / count).toFixed(2));
    const sumAllChars = avgChars.reduce((acc, val) => acc + Number(val), 0);
    const avgSection4 = (sumAllChars / 8).toFixed(2);

    const overallAvg = ((Number(avgSection3) + Number(avgSection4)) / 2).toFixed(2);

    return {
      count,
      prep: avgPrep,
      act: avgAct,
      part: avgPart,
      media: avgMedia,
      assess: avgAssess,
      section3: avgSection3,
      chars: avgChars,
      section4: avgSection4,
      overall: overallAvg,
      evalsList: evals
    };
  };

  const avgData = getAverageEvalData(supervision);

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '700px' }}>
        <div className="modal-header">
          <h3>รายงานสรุปผลการนิเทศการจัดการเรียนรู้รายบุคคล</h3>
          <button type="button" className="modal-close-btn" onClick={onClose}>×</button>
        </div>
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
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
                  <div style={{ fontSize: '11px', color: 'var(--text-medium)' }}>เต็ม 5.00 คะแนน</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '13px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span><strong>1. ด้านการจัดกระบวนการเรียนรู้ (3.1-3.5):</strong></span>
                    <span style={{ fontWeight: 700, color: 'var(--primary-color)' }}>{avgData.section3} / 5.00</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span><strong>2. ด้านคุณลักษณะของผู้เรียน (1-8):</strong></span>
                    <span style={{ fontWeight: 700, color: 'var(--primary-color)' }}>{avgData.section4} / 5.00</span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-medium)', borderTop: '1px solid #d4f2e6', paddingTop: '0.4rem', marginTop: '0.2rem' }}>
                    * คำนวณเฉลี่ยรวมจากแบบประเมินจำนวน {avgData.count} ฉบับ
                  </div>
                </div>
              </div>

              {/* Detailed Scores Breakdown */}
              <div>
                <h4 style={{ fontWeight: 700, fontSize: '14px', color: 'var(--primary-color)', marginBottom: '0.5rem' }}>คะแนนเฉลี่ยรายประเด็น</h4>
                <div style={{ border: '1px solid var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
                  <table style={{ margin: 0, width: '100%' }}>
                    <thead style={{ backgroundColor: '#f8f9fa' }}>
                      <tr>
                        <th style={{ padding: '0.5rem', fontSize: '12px' }}>ประเด็นประเมินการสังเกตชั้นเรียน</th>
                        <th style={{ padding: '0.5rem', fontSize: '12px', textAlign: 'center', width: '90px' }}>คะแนนเฉลี่ย</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ padding: '0.5rem', fontSize: '13px', fontWeight: 600 }} colSpan={2}>ส่วนที่ 1: การสังเกตกิจกรรมกระบวนการเรียนรู้</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '0.4rem 0.8rem', fontSize: '12px' }}>3.1 การเตรียมการสอน (การวางแผนและจัดเตรียมความพร้อม)</td>
                        <td style={{ padding: '0.4rem', fontSize: '13px', fontWeight: 700, textAlign: 'center', color: 'var(--primary-color)' }}>{avgData.prep}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '0.4rem 0.8rem', fontSize: '12px' }}>3.2 กิจกรรมการเรียนรู้ (กระบวนการจัดการเรียนรู้เชิงรุก)</td>
                        <td style={{ padding: '0.4rem', fontSize: '13px', fontWeight: 700, textAlign: 'center', color: 'var(--primary-color)' }}>{avgData.act}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '0.4rem 0.8rem', fontSize: '12px' }}>3.3 การมีส่วนร่วมของนักเรียน (ความสนใจและการมีปฏิสัมพันธ์)</td>
                        <td style={{ padding: '0.4rem', fontSize: '13px', fontWeight: 700, textAlign: 'center', color: 'var(--primary-color)' }}>{avgData.part}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '0.4rem 0.8rem', fontSize: '12px' }}>3.4 การใช้สื่อและเทคโนโลยี (ความเหมาะสมและช่วยการเรียนรู้)</td>
                        <td style={{ padding: '0.4rem', fontSize: '13px', fontWeight: 700, textAlign: 'center', color: 'var(--primary-color)' }}>{avgData.media}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '0.4rem 0.8rem', fontSize: '12px' }}>3.5 การวัดและประเมินผล (สอดคล้องกับวัตถุประสงค์และมีความหลากหลาย)</td>
                        <td style={{ padding: '0.4rem', fontSize: '13px', fontWeight: 700, textAlign: 'center', color: 'var(--primary-color)' }}>{avgData.assess}</td>
                      </tr>

                      <tr>
                        <td style={{ padding: '0.5rem', fontSize: '13px', fontWeight: 600 }} colSpan={2}>ส่วนที่ 2: คุณลักษณะของผู้เรียนที่เกิดขึ้นจริง</td>
                      </tr>
                      {[
                        '(1) ผู้เรียนสามารถเข้าถึงสิ่งที่เรียนและเข้าใจบทเรียน',
                        '(2) ผู้เรียนสามารถเชื่อมโยงความรู้หรือประสบการณ์เดิมกับการเรียนรู้ใหม่',
                        '(3) ผู้เรียนได้สร้างความรู้เองหรือได้สร้างประสบการณ์ใหม่จากการเรียนรู้',
                        '(4) ผู้เรียนได้รับการกระตุ้นและเกิดแรงจูงใจในการเรียนรู้',
                        '(5) ผู้เรียนได้รับการพัฒนาทักษะความเชี่ยวชาญจากการเรียนรู้',
                        '(6) ผู้เรียนได้รับข้อมูลสะท้อนกลับเพื่อปรับปรุงการเรียนรู้',
                        '(7) ผู้เรียนได้รับการพัฒนาการเรียนรู้ในบรรยากาศชั้นเรียนที่เหมาะสม',
                        '(8) ผู้เรียนสามารถกำกับการเรียนรู้และมีการเรียนรู้แบบนำตนเอง'
                      ].map((label, idx) => (
                        <tr key={idx}>
                          <td style={{ padding: '0.4rem 0.8rem', fontSize: '12px' }}>{label}</td>
                          <td style={{ padding: '0.4rem', fontSize: '13px', fontWeight: 700, textAlign: 'center', color: 'var(--primary-color)' }}>{avgData.chars[idx]}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Qualitative Comments & Suggestions */}
              <div>
                <h4 style={{ fontWeight: 700, fontSize: '14px', color: 'var(--primary-color)', marginBottom: '0.5rem' }}>ข้อเสนอแนะและข้อสังเกตจากคณะกรรมการนิเทศ</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {avgData.evalsList.map((ev) => (
                    <div key={ev.supervisorId} style={{ backgroundColor: '#fafafa', border: '1px solid #eee', padding: '0.75rem', borderRadius: '4px', fontSize: '13px' }}>
                      <div style={{ fontWeight: 700, color: 'var(--primary-color)', borderBottom: '1px dashed #e2e8f0', paddingBottom: '0.25rem', marginBottom: '0.4rem' }}>
                        ✍️ ผู้นิเทศ: {ev.supervisorName}
                      </div>
                      <div style={{ marginBottom: '0.4rem' }}>
                        <strong>ข้อสังเกตเชิงคุณภาพ:</strong>
                        <div style={{ color: 'var(--text-dark)', marginTop: '0.1rem', whiteSpace: 'pre-wrap' }}>{ev.qualitative || '- ไม่มีระบุ -'}</div>
                      </div>
                      <div>
                        <strong>ข้อเสนอแนะและสรุป:</strong>
                        <div style={{ color: 'var(--text-dark)', marginTop: '0.1rem', whiteSpace: 'pre-wrap' }}>{ev.suggestions || '- ไม่มีระบุ -'}</div>
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
