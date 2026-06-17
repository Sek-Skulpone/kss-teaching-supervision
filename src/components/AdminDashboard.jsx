import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, UserCheck, Eye, ClipboardList, Trash2, Calendar as CalendarIcon, Users } from 'lucide-react';

export default function AdminDashboard({
  supervisions,
  teachers,
  onAssignSupervisor,
  onRemoveSupervisor,
  onApproveVolunteer,
  onRejectVolunteer
}) {
  const [selectedTeacherId, setSelectedTeacherId] = useState({});
  const [selectedReport, setSelectedReport] = useState(null);

  // Get current date string in local time (YYYY-MM-DD)
  const getTodayDateString = () => {
    const today = new Date();
    const offset = today.getTimezoneOffset();
    const localToday = new Date(today.getTime() - (offset * 60 * 1000));
    return localToday.toISOString().split('T')[0];
  };

  const todayStr = getTodayDateString();

  // Filter today's supervisions
  const todaySupervisions = supervisions.filter(s => s.date === todayStr);

  // Filter pending assignments (both purely pending, pending volunteer approval, or supervisors count under 2)
  const pendingAssignments = supervisions.filter(
    s => s.status !== 'completed' && 
         (s.status === 'pending' || s.status === 'pending_approval' || (s.supervisors && s.supervisors.length < 2))
  );

  // Filter approved/completed supervisions
  const activeAndCompleted = supervisions.filter(s => s.status === 'approved' || s.status === 'completed');

  // Handle direct supervisor assignment
  const handleAssignClick = (supervisionId) => {
    const teacherId = selectedTeacherId[supervisionId];
    if (!teacherId) {
      alert('กรุณาเลือกรายชื่อครูที่จะแต่งตั้งเป็นผู้นิเทศ');
      return;
    }
    const supervisor = teachers.find(t => t.id === teacherId);
    if (supervisor) {
      onAssignSupervisor(supervisionId, supervisor.id, supervisor.name);
      // Clean selected state
      setSelectedTeacherId(prev => {
        const next = { ...prev };
        delete next[supervisionId];
        return next;
      });
      alert('แต่งตั้งผู้นิเทศสำเร็จ!');
    }
  };

  // Format Date to Thai style (e.g. 17 มิ.ย. 2569)
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
    <div>
      {/* 1. Daily Notification / Reminder */}
      <div className="notification-banner">
        <div className="notification-banner-icon">
          <AlertCircle size={24} />
        </div>
        <div className="notification-banner-content" style={{ width: '100%' }}>
          <h4>แจ้งเตือนตารางการนิเทศการสอนประจำวันนี้ ({formatThaiDate(todayStr)})</h4>
          {todaySupervisions.length === 0 ? (
            <p style={{ fontSize: '14px', color: '#7d6608', margin: '0.25rem 0 0' }}>
              วันนี้ไม่มีข้อกำหนดการนิเทศการเรียนการสอนที่ระบุไว้ในระบบ
            </p>
          ) : (
            <ul>
              {todaySupervisions.map(s => (
                <li key={s.id} style={{ margin: '0.4rem 0' }}>
                  <strong>เวลา {s.time} น.</strong> | ครูผู้จัดการเรียนรู้: <span style={{ textDecoration: 'underline' }}>{s.teacherName}</span> | วิชา: {s.subject} (ชั้น ม.{s.grade.replace('ม.', '')}/{s.room}) | 
                  คณะกรรมการนิเทศ: {s.supervisors && s.supervisors.length > 0 ? (
                    <span style={{ color: 'var(--primary-color)', fontWeight: 'bold' }}>{s.supervisors.map(sup => sup.name).join(', ')}</span>
                  ) : (
                    <span style={{ color: '#c0392b', fontWeight: 'bold' }}>ยังไม่ได้รับการแต่งตั้ง (โปรดดำเนินการระบุด้านล่าง)</span>
                  )}
                  {s.supervisors && s.supervisors.length > 0 && s.supervisors.length < 2 && (
                    <span style={{ color: '#e67e22', fontSize: '12px', fontWeight: 'bold', marginLeft: '0.25rem' }}>(ต้องการผู้นิเทศเพิ่ม {2 - s.supervisors.length} ท่าน)</span>
                  )}
                  {s.status === 'completed' && <span style={{ color: 'var(--status-completed)', marginLeft: '0.5rem', fontWeight: 'bold' }}>(รายงานผลเรียบร้อยแล้ว)</span>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Stats Quick Overview */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#e8f5e9', color: 'var(--primary-color)' }}>
            <ClipboardList />
          </div>
          <div className="stat-details">
            <h5>จำนวนการจองการนิเทศทั้งหมด</h5>
            <p>{supervisions.length} รายวิชา</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#fef9e7', color: 'var(--secondary-hover)' }}>
            <AlertCircle />
          </div>
          <div className="stat-details">
            <h5>อยู่ระหว่างจัดสรรคณะกรรมการ</h5>
            <p>{pendingAssignments.length} รายการ</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#f0fdf4', color: 'var(--status-approved)' }}>
            <CheckCircle2 />
          </div>
          <div className="stat-details">
            <h5>แต่งตั้งคณะกรรมการเสร็จสิ้น</h5>
            <p>{supervisions.filter(s => s.status === 'approved').length} รายการ</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#f0f9ff', color: 'var(--status-completed)' }}>
            <UserCheck />
          </div>
          <div className="stat-details">
            <h5>การนิเทศเสร็จสมบูรณ์</h5>
            <p>{supervisions.filter(s => s.status === 'completed').length} รายการ</p>
          </div>
        </div>
      </div>

      {/* 2. Management of Pending Assignments / Volunteers */}
      <div className="card">
        <h2 className="card-title">
          <UserCheck />
          จัดการและจัดสรรผู้นิเทศ (คำขอรอดำเนินการ)
        </h2>

        {pendingAssignments.length === 0 ? (
          <p style={{ color: 'var(--text-light)', textAlign: 'center', padding: '2rem' }}>ไม่มีคำขอเสนอความจำนงหรือจัดสรรผู้นิเทศค้างอยู่ในระบบ</p>
        ) : (
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>ครูผู้ขอรับการนิเทศ</th>
                  <th>วิชา</th>
                  <th>ระดับชั้น/ห้อง</th>
                  <th>วัน-เวลานิเทศ</th>
                  <th>แผนการสอน</th>
                  <th>การจัดการรายนามคณะกรรมการนิเทศ</th>
                </tr>
              </thead>
              <tbody>
                {pendingAssignments.map((req) => (
                  <tr key={req.id}>
                    <td style={{ fontWeight: 600 }}>{req.teacherName}</td>
                    <td>{req.subject}</td>
                    <td>{req.grade}/{req.room}</td>
                    <td>
                      <div>{formatThaiDate(req.date)}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-medium)' }}>เวลา {req.time} น.</div>
                    </td>
                    <td>
                      <a href={req.lessonPlanUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary-color)', textDecoration: 'underline' }}>
                        เปิดดูแผน
                      </a>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {/* Current Supervisors */}
                        {req.supervisors && req.supervisors.length > 0 && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-medium)' }}>ผู้นิเทศปัจจุบัน:</span>
                            {req.supervisors.map(s => (
                              <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f1f1f1', padding: '2px 8px', borderRadius: '4px', fontSize: '12px' }}>
                                <span>{s.name}</span>
                                <button 
                                  onClick={() => onRemoveSupervisor(req.id, s.id)}
                                  style={{ border: 'none', background: 'none', color: '#e74c3c', cursor: 'pointer', padding: '0 4px', fontSize: '11px', fontWeight: 'bold' }}
                                  title="ถอนการแต่งตั้ง"
                                >
                                  ✖
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {/* Requirement Warning */}
                        {(!req.supervisors || req.supervisors.length < 2) && (
                          <span style={{ color: '#e67e22', fontSize: '11px', fontWeight: 600 }}>
                            ⚠️ ต้องการคณะกรรมการนิเทศเพิ่มอีก {2 - (req.supervisors ? req.supervisors.length : 0)} ท่าน
                          </span>
                        )}

                        {/* Volunteer Banner */}
                        {req.status === 'pending_approval' && req.volunteerId && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', backgroundColor: 'var(--secondary-light)', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--secondary-color)', marginTop: '0.25rem' }}>
                            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--secondary-hover)' }}>
                              🙋‍♂️ {req.volunteerName} เสนอความจำนง
                            </span>
                            <div style={{ display: 'flex', gap: '0.25rem' }}>
                              <button
                                className="btn btn-primary"
                                style={{ padding: '2px 8px', fontSize: '11px' }}
                                onClick={() => {
                                  onApproveVolunteer(req.id);
                                  alert('อนุมัติการแต่งตั้งเรียบร้อยแล้ว');
                                }}
                              >
                                อนุมัติ
                              </button>
                              <button
                                className="btn btn-outline btn-danger"
                                style={{ padding: '2px 8px', fontSize: '11px', color: '#e74c3c', borderColor: '#e74c3c' }}
                                onClick={() => {
                                  onRejectVolunteer(req.id);
                                  alert('ปฏิเสธคำขอเรียบร้อยแล้ว');
                                }}
                              >
                                ปฏิเสธ
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Assignment Selector (Only show if need more) */}
                        {(!req.supervisors || req.supervisors.length < 2) && (
                          <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.25rem' }}>
                            <select
                              value={selectedTeacherId[req.id] || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                setSelectedTeacherId(prev => ({ ...prev, [req.id]: val }));
                              }}
                              style={{ padding: '4px 8px', fontSize: '12px', flex: 1 }}
                            >
                              <option value="">-- แต่งตั้งผู้นิเทศ --</option>
                              {teachers
                                .filter(t => t.id !== req.teacherId && (!req.supervisors || !req.supervisors.some(sup => sup.id === t.id)))
                                .map(t => (
                                  <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </select>
                            <button
                              className="btn btn-primary"
                              style={{ padding: '4px 8px', fontSize: '12px' }}
                              onClick={() => handleAssignClick(req.id)}
                            >
                              แต่งตั้ง
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 3. Completed Supervisions & Logs */}
      <div className="card">
        <h2 className="card-title">
          <Users />
          ตารางบันทึกการนิเทศการสอนทั้งหมด (ได้รับการแต่งตั้ง / เสร็จสิ้นแล้ว)
        </h2>

        {activeAndCompleted.length === 0 ? (
          <p style={{ color: 'var(--text-light)', textAlign: 'center', padding: '2rem' }}>ไม่พบประวัติข้อมูลตารางการนิเทศการสอนที่ได้รับการแต่งตั้ง</p>
        ) : (
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>ครูผู้รับนิเทศ</th>
                  <th>รายวิชา</th>
                  <th>ระดับชั้น/ห้องเรียน</th>
                  <th>วัน-เวลาที่นิเทศ</th>
                  <th>คณะกรรมการนิเทศ</th>
                  <th>สถานะการนิเทศ</th>
                  <th>รายงานบันทึกหลังสอน</th>
                </tr>
              </thead>
              <tbody>
                {activeAndCompleted.map((req) => (
                  <tr key={req.id}>
                    <td style={{ fontWeight: 600 }}>{req.teacherName}</td>
                    <td>{req.subject}</td>
                    <td>ชั้น ม.{req.grade.replace('ม.', '')}/{req.room}</td>
                    <td>{formatThaiDate(req.date)} (เวลา {req.time} น.)</td>
                    <td style={{ fontWeight: 500, color: 'var(--primary-color)', fontSize: '13px' }}>
                      {req.supervisors ? req.supervisors.map(s => s.name).join(', ') : 'ยังไม่แต่งตั้ง'}
                    </td>
                    <td>
                      <span className={`badge badge-${req.status}`}>
                        {req.status === 'approved' ? 'แต่งตั้งคณะกรรมการแล้ว' : 'บันทึกหลังการสอนแล้ว'}
                      </span>
                    </td>
                    <td>
                      {req.status === 'completed' ? (
                        <button
                          className="btn btn-outline"
                          style={{ padding: '0.3rem 0.6rem', fontSize: '12px', display: 'inline-flex', gap: '0.25rem', alignItems: 'center' }}
                          onClick={() => setSelectedReport(req)}
                        >
                          <Eye size={12} /> เปิดดูรายงานผลหลังสอน
                        </button>
                      ) : (
                        <span style={{ fontSize: '12px', color: 'var(--text-light)', fontStyle: 'italic' }}>รอคุณครูรายงานผล</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* View Post-Teaching Record Report Modal */}
      {selectedReport && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>รายงานบันทึกหลังการจัดการเรียนรู้</h3>
              <button className="modal-close-btn" onClick={() => setSelectedReport(null)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', backgroundColor: '#f8f9fa', padding: '0.8rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.25rem', fontSize: '13px', borderLeft: '4px solid var(--primary-color)' }}>
                <div><strong>ครูผู้สอน:</strong> {selectedReport.teacherName}</div>
                <div><strong>วิชา:</strong> {selectedReport.subject} (ชั้น ม.{selectedReport.grade.replace('ม.', '')}/{selectedReport.room})</div>
                <div><strong>วัน-เวลาที่นิเทศ:</strong> {formatThaiDate(selectedReport.date)} เวลา {selectedReport.time} น.</div>
                <div><strong>คณะกรรมการนิเทศ:</strong> {selectedReport.supervisors ? selectedReport.supervisors.map(s => s.name).join(', ') : 'ยังไม่แต่งตั้ง'}</div>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <h5 style={{ fontWeight: 700, color: 'var(--primary-color)', fontSize: '14px', marginBottom: '0.25rem' }}>1. ผลการจัดการเรียนรู้ (ความสำเร็จและสมรรถนะผู้เรียน)</h5>
                <p style={{ fontSize: '14px', whiteSpace: 'pre-wrap', backgroundColor: '#fafafa', padding: '0.75rem', borderRadius: '4px', border: '1px solid #eee' }}>
                  {selectedReport.postTeachingRecord.studentOutcome}
                </p>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <h5 style={{ fontWeight: 700, color: 'var(--primary-color)', fontSize: '14px', marginBottom: '0.25rem' }}>2. ปัญหาและอุปสรรคในการสอน</h5>
                <p style={{ fontSize: '14px', whiteSpace: 'pre-wrap', backgroundColor: '#fafafa', padding: '0.75rem', borderRadius: '4px', border: '1px solid #eee' }}>
                  {selectedReport.postTeachingRecord.problems}
                </p>
              </div>

              <div>
                <h5 style={{ fontWeight: 700, color: 'var(--primary-color)', fontSize: '14px', marginBottom: '0.25rem' }}>3. ข้อเสนอแนะและแนวทางแก้ไขสำหรับการจัดการเรียนรู้ครั้งถัดไป</h5>
                <p style={{ fontSize: '14px', whiteSpace: 'pre-wrap', backgroundColor: '#fafafa', padding: '0.75rem', borderRadius: '4px', border: '1px solid #eee' }}>
                  {selectedReport.postTeachingRecord.solutions}
                </p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={() => setSelectedReport(null)}>ปิดหน้าต่าง</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
