import React, { useState } from 'react';
import { OBSERVATION_ITEMS } from '../utils/observationItems';
import { formatThaiDate } from '../utils/thaiDate';

export default function EvaluationSummaryModal({ supervision, onClose }) {
  const [activeLightboxImage, setActiveLightboxImage] = useState(null);

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
          <button type="button" className="modal-close-btn" aria-label="ปิดหน้าต่าง" onClick={onClose}>×</button>
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

                      {ev.images && ev.images.length > 0 && (
                        <div style={{ marginTop: '0.75rem', borderTop: '1px dashed #e2e8f0', paddingTop: '0.5rem' }}>
                          <strong style={{ display: 'block', marginBottom: '0.4rem' }}>📷 ภาพประกอบการนิเทศ:</strong>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '8px' }}>
                            {ev.images.map((imgUrl, imgIdx) => (
                              <div
                                key={imgIdx}
                                role="button"
                                tabIndex={0}
                                aria-label={`ดูรูปภาพประกอบการนิเทศ ${imgIdx + 1}`}
                                onClick={() => setActiveLightboxImage(imgUrl)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    setActiveLightboxImage(imgUrl);
                                  }
                                }}
                                style={{
                                  position: 'relative',
                                  width: '100%',
                                  aspectRatio: '4/3',
                                  borderRadius: '4px',
                                  overflow: 'hidden',
                                  border: '1px solid #cbd5e1',
                                  cursor: 'pointer',
                                  transition: 'transform 0.2s, box-shadow 0.2s',
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.transform = 'scale(1.05)';
                                  e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.transform = 'none';
                                  e.currentTarget.style.boxShadow = 'none';
                                }}
                              >
                                <img 
                                  src={imgUrl} 
                                  alt={`Supervision photo ${imgIdx + 1}`} 
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
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

      {/* Image Lightbox */}
      {activeLightboxImage && (
        <div 
          onClick={() => setActiveLightboxImage(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            cursor: 'pointer'
          }}
        >
          <button
            onClick={() => setActiveLightboxImage(null)}
            aria-label="ปิดรูปภาพ"
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              backgroundColor: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              color: 'white',
              fontSize: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              lineHeight: 1
            }}
          >
            ×
          </button>
          <img 
            src={activeLightboxImage} 
            alt="Supervision Photo Expanded" 
            style={{ 
              maxWidth: '90%', 
              maxHeight: '85%', 
              objectFit: 'contain',
              borderRadius: '4px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
              cursor: 'default'
            }} 
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
