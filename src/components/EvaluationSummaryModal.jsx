import React, { useState, useEffect } from 'react';
import { OBSERVATION_ITEMS } from '../utils/observationItems';
import { formatThaiDate } from '../utils/thaiDate';
import { getEvaluationImages } from '../db';

export default function EvaluationSummaryModal({ supervision, onClose, canDeleteEvaluations = false, onDeleteEvaluation }) {
  // Photos live outside the supervision record (see db.js EVAL_IMG_PREFIX),
  // so they're fetched when this report opens rather than being carried in
  // the supervisions payload every page load.
  const [imagesBySupervisor, setImagesBySupervisor] = useState({});

  useEffect(() => {
    let cancelled = false;
    getEvaluationImages(supervision.id)
      .then(map => { if (!cancelled) setImagesBySupervisor(map || {}); })
      .catch(err => console.error('Could not load evaluation images:', err));
    return () => { cancelled = true; };
  }, [supervision.id]);
  const [activeLightboxImage, setActiveLightboxImage] = useState(null);
  // 'average' shows the committee-wide averages; otherwise holds the
  // supervisorId whose individual scoring is being viewed.
  const [activeView, setActiveView] = useState('average');
  const [deletingId, setDeletingId] = useState(null);

  const handleDeleteEvaluation = async (ev) => {
    if (!window.confirm(
      `ต้องการลบผลการประเมินของ "${ev.supervisorName}" ใช่หรือไม่?\n\n` +
      `ผลประเมินของกรรมการท่านอื่นจะยังคงอยู่ และค่าเฉลี่ยจะถูกคำนวณใหม่`
    )) return;

    setDeletingId(ev.supervisorId);
    try {
      const success = await onDeleteEvaluation(supervision.id, ev.supervisorId);
      if (success) {
        setActiveView('average');
      } else {
        alert('เกิดข้อผิดพลาดในการลบผลการประเมิน กรุณาลองใหม่อีกครั้ง');
      }
    } finally {
      setDeletingId(null);
    }
  };

  // Per-item scoring for a single committee member, plus that member's own
  // overall average across the items they marked as practised.
  const getIndividualEvalData = (ev) => {
    const itemStats = {};
    let sum = 0;
    let count = 0;
    OBSERVATION_ITEMS.forEach(item => {
      const r = ev.ratings?.[item.id];
      const practice = r?.practice === 'มี' ? 'มี' : 'ไม่มี';
      const score = practice === 'มี' ? (r?.score || 0) : null;
      itemStats[item.id] = { practice, score };
      if (practice === 'มี') {
        sum += score;
        count++;
      }
    });
    return {
      itemStats,
      overall: count > 0 ? (sum / count).toFixed(2) : '-'
    };
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
      <div className="modal-content printable-report" style={{ maxWidth: '750px', width: '90%' }}>
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
              {/* Switch between the committee average and each member's own
                  scoring. Screen-only: on paper the selected view is printed
                  as-is, so the switcher itself is noise. */}
              <div className="no-print">
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-medium)', marginBottom: '0.4rem' }}>
                  เลือกดูผลการประเมิน:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  <button
                    type="button"
                    className={`btn ${activeView === 'average' ? 'btn-primary' : 'btn-outline'}`}
                    style={{ padding: '0.35rem 0.8rem', fontSize: '12px' }}
                    onClick={() => setActiveView('average')}
                  >
                    📊 ค่าเฉลี่ยรวม ({avgData.count} ท่าน)
                  </button>
                  {avgData.evalsList.map(ev => (
                    <button
                      key={ev.supervisorId}
                      type="button"
                      className={`btn ${activeView === ev.supervisorId ? 'btn-primary' : 'btn-outline'}`}
                      style={{ padding: '0.35rem 0.8rem', fontSize: '12px' }}
                      onClick={() => setActiveView(ev.supervisorId)}
                    >
                      ✍️ {ev.supervisorName}
                    </button>
                  ))}
                </div>

                {/* Admin-only: remove one member's evaluation. Scoped to the
                    member currently being viewed so it can't be mis-clicked. */}
                {canDeleteEvaluations && activeView !== 'average' && (() => {
                  const target = avgData.evalsList.find(ev => ev.supervisorId === activeView);
                  if (!target) return null;
                  return (
                    <button
                      type="button"
                      className="btn btn-outline"
                      style={{ marginTop: '0.5rem', padding: '0.3rem 0.7rem', fontSize: '11.5px', color: '#e74c3c', borderColor: '#e74c3c' }}
                      onClick={() => handleDeleteEvaluation(target)}
                      disabled={deletingId === target.supervisorId}
                    >
                      🗑️ {deletingId === target.supervisorId
                        ? 'กำลังลบ...'
                        : `ลบผลการประเมินของ ${target.supervisorName}`}
                    </button>
                  );
                })()}
              </div>

              {/* Score Card — committee average, or the selected member's own */}
              {(() => {
                const activeEval = activeView === 'average'
                  ? null
                  : avgData.evalsList.find(ev => ev.supervisorId === activeView);
                const individual = activeEval ? getIndividualEvalData(activeEval) : null;
                const shownOverall = individual ? individual.overall : avgData.overall;

                return (
                  <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '1rem', alignItems: 'center', backgroundColor: '#f0fdf4', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid #b2f5ea' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--status-approved)' }}>
                        {activeEval ? 'คะแนนของกรรมการท่านนี้' : 'คะแนนเฉลี่ยรวม'}
                      </div>
                      <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--primary-color)', lineHeight: 1.1 }}>{shownOverall}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-medium)' }}>เต็ม 4.00 คะแนน</div>
                    </div>
                    <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <div><strong>ระดับคุณภาพการจัดกิจกรรมการเรียนรู้:</strong></div>
                      <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--primary-color)' }}>
                        {shownOverall === '-' ? '-' :
                         Number(shownOverall) >= 3.50 ? 'ดีมาก (Excellent)' :
                         Number(shownOverall) >= 2.75 ? 'ดี (Good)' :
                         Number(shownOverall) >= 2.00 ? 'พอใช้ (Fair)' : 'ปรับปรุง (Need Improvement)'}
                      </div>
                      <div style={{ fontSize: '11.5px', color: 'var(--text-medium)', marginTop: '0.25rem', borderTop: '1px solid #d4f2e6', paddingTop: '0.25rem' }}>
                        {activeEval
                          ? `* คะแนนจากแบบประเมินของ ${activeEval.supervisorName} เพียงท่านเดียว (เฉลี่ยเฉพาะข้อที่มีการปฏิบัติจริง)`
                          : `* คำนวณจากแบบประเมินของผู้นิเทศทั้งหมด ${avgData.count} ท่าน (คำนวณเฉลี่ยเฉพาะข้อที่มีการปฏิบัติจริง)`}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Detailed Scores Breakdown */}
              {(() => {
                const activeEval = activeView === 'average'
                  ? null
                  : avgData.evalsList.find(ev => ev.supervisorId === activeView);
                const individual = activeEval ? getIndividualEvalData(activeEval) : null;

                return (
                  <div>
                    <h4 style={{ fontWeight: 700, fontSize: '14px', color: 'var(--primary-color)', marginBottom: '0.5rem' }}>
                      {activeEval
                        ? `คะแนนรายข้อของ ${activeEval.supervisorName}`
                        : 'คะแนนเฉลี่ยรายข้อการสังเกตชั้นเรียน'}
                    </h4>
                    <div style={{ border: '1px solid var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
                      <table style={{ margin: 0, width: '100%', fontSize: '12px' }}>
                        <thead style={{ backgroundColor: '#f8f9fa' }}>
                          <tr>
                            <th style={{ padding: '0.5rem 0.4rem', textAlign: 'center', width: '50px' }}>ที่</th>
                            <th style={{ padding: '0.5rem 0.4rem', textAlign: 'left' }}>รายการประเมิน</th>
                            <th style={{ padding: '0.5rem 0.4rem', textAlign: 'center', width: '100px' }}>
                              {activeEval ? 'การปฏิบัติ' : 'อัตราการปฏิบัติ'}
                            </th>
                            <th style={{ padding: '0.5rem 0.4rem', textAlign: 'center', width: '90px' }}>
                              {activeEval ? 'คะแนน' : 'คะแนนเฉลี่ย'}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {OBSERVATION_ITEMS.map((item) => {
                            const isFirstGroupItem = item.id === '1_1';
                            const stats = avgData.itemStats[item.id] || { practiceRate: '0', avgScore: '-' };
                            const own = individual ? individual.itemStats[item.id] : null;

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
                                  {own ? (
                                    <>
                                      <td style={{ padding: '0.4rem', textAlign: 'center', fontWeight: 600, color: own.practice === 'มี' ? '#27ae60' : '#e67e22' }}>
                                        {own.practice === 'มี' ? '✔ มี' : '✖ ไม่มี'}
                                      </td>
                                      <td style={{ padding: '0.4rem', textAlign: 'center', fontWeight: 700, color: own.score !== null ? 'var(--primary-color)' : 'var(--text-light)' }}>
                                        {own.score !== null ? own.score.toFixed(2) : '-'}
                                      </td>
                                    </>
                                  ) : (
                                    <>
                                      <td style={{ padding: '0.4rem', textAlign: 'center', color: stats.practiceRate === '100' ? '#27ae60' : '#e67e22', fontWeight: 600 }}>
                                        {stats.practiceRate}%
                                      </td>
                                      <td style={{ padding: '0.4rem', textAlign: 'center', fontWeight: 700, color: stats.avgScore !== '-' ? 'var(--primary-color)' : 'var(--text-light)' }}>
                                        {stats.avgScore}
                                      </td>
                                    </>
                                  )}
                                </tr>
                              </React.Fragment>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}

              {/* Qualitative Comments & Suggestions */}
              <div>
                <h4 style={{ fontWeight: 700, fontSize: '14px', color: 'var(--primary-color)', marginBottom: '0.5rem' }}>
                  {activeView === 'average'
                    ? 'ข้อเสนอแนะของคณะกรรมการนิเทศ (ทุกท่าน)'
                    : 'ข้อเสนอแนะของกรรมการท่านนี้'}
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {avgData.evalsList
                    .filter(ev => activeView === 'average' || ev.supervisorId === activeView)
                    .map((ev) => (
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

          {/* Supervision photos — kept at the very end of the report, grouped
              by the supervisor who submitted them. Follows the same
              average/individual scoping as the rest of the report. */}
          {avgData && (() => {
            // Prefer the separately-stored photos; fall back to any still
            // inline on older records that haven't been migrated yet.
            const imagesFor = (ev) => imagesBySupervisor[ev.supervisorId] || ev.images || [];
            const shown = avgData.evalsList
              .filter(ev => activeView === 'average' || ev.supervisorId === activeView)
              .filter(ev => imagesFor(ev).length > 0);
            if (shown.length === 0) return null;

            return (
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                <h4 style={{ fontWeight: 700, fontSize: '14px', color: 'var(--primary-color)', marginBottom: '0.75rem' }}>
                  📷 ภาพประกอบการนิเทศ
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {shown.map(ev => (
                    <div key={ev.supervisorId} className="print-keep-together">
                      <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-medium)', marginBottom: '0.4rem' }}>
                        โดย {ev.supervisorName}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '8px' }}>
                        {imagesFor(ev).map((imgUrl, imgIdx) => (
                          <div
                            key={imgIdx}
                            role="button"
                            tabIndex={0}
                            aria-label={`ดูรูปภาพประกอบการนิเทศของ ${ev.supervisorName} รูปที่ ${imgIdx + 1}`}
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
                              transition: 'transform 0.2s, box-shadow 0.2s'
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
                              alt={`ภาพประกอบการนิเทศโดย ${ev.supervisorName} รูปที่ ${imgIdx + 1}`}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-outline" onClick={() => window.print()}>
            🖨️ พิมพ์รายงาน
          </button>
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
