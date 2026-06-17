import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, UserCheck, Eye, ClipboardList, Trash2, Calendar as CalendarIcon, Users, UserPlus, Shield } from 'lucide-react';

const PERIODS_LIST = [
  'คาบที่ 1 (08.30 - 09.20 น.)',
  'คาบที่ 2 (09.20 - 10.10 น.)',
  'คาบที่ 3 (10.20 - 11.10 น.)',
  'คาบที่ 4 (11.10 - 12.00 น.)',
  'คาบที่ 5 (13.00 - 13.50 น.)',
  'คาบที่ 6 (13.50 - 14.40 น.)',
  'คาบที่ 7 (14.40 - 15.30 น.)'
];

export default function AdminDashboard({
  supervisions,
  teachers,
  onAssignSupervisor,
  onRemoveSupervisor,
  onApproveVolunteer,
  onRejectVolunteer,
  onAddTeacher,
  onDeleteTeacher,
  onUpdateSupervision
}) {
  const [activeSubTab, setActiveSubTab] = useState('supervisions');
  const [selectedTeacherId, setSelectedTeacherId] = useState({});
  const [selectedReport, setSelectedReport] = useState(null);

  // States for scheduling date/time
  const [editingScheduleId, setEditingScheduleId] = useState(null);
  const [schedDate, setSchedDate] = useState('');
  const [schedTime, setSchedTime] = useState('');

  // Form states for adding new teacher
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newName, setNewName] = useState('');
  const [newPosition, setNewPosition] = useState('');
  const [newRole, setNewRole] = useState('teacher');
  const [addError, setAddError] = useState('');

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

  // Form submit handler for adding personnel
  const handleAddTeacherSubmit = async (e) => {
    e.preventDefault();
    setAddError('');

    const formattedUsername = newUsername.trim().toLowerCase();
    if (!formattedUsername || !newPassword || !newName || !newPosition) {
      setAddError('กรุณากรอกข้อมูลให้ครบทุกช่อง');
      return;
    }

    // Validation for duplicate username
    const exists = teachers.some(t => t.username.toLowerCase() === formattedUsername);
    if (exists) {
      setAddError('ชื่อผู้ใช้งานนี้มีอยู่ในระบบแล้ว กรุณาใช้ชื่ออื่น');
      return;
    }

    const payload = {
      username: formattedUsername,
      password: newPassword,
      name: newName,
      position: newPosition,
      role: newRole
    };

    const success = await onAddTeacher(payload);
    if (success) {
      alert('เพิ่มข้อมูลบุคลากรสำเร็จเรียบร้อยแล้ว');
      setNewUsername('');
      setNewPassword('');
      setNewName('');
      setNewPosition('');
      setNewRole('teacher');
    } else {
      setAddError('เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง');
    }
  };

  // Click handler for deleting personnel
  const handleDeleteTeacherClick = async (teacher) => {
    if (teacher.username === 'academic' || teacher.username === 'admin') {
      alert('ไม่สามารถลบบัญชีหลักของระบบได้');
      return;
    }

    if (window.confirm(`คุณแน่ใจหรือไม่ที่จะลบข้อมูลบุคลากร: ${teacher.name}? การลบนี้จะส่งผลต่อการเข้าสู่ระบบและรายการที่เกี่ยวข้องของครูท่านนี้`)) {
      const success = await onDeleteTeacher(teacher.id);
      if (success) {
        alert('ลบข้อมูลบุคลากรเรียบร้อยแล้ว');
      } else {
        alert('เกิดข้อผิดพลาดในการลบข้อมูล กรุณาลองใหม่อีกครั้ง');
      }
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
      {/* Sub-navigation Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <button 
          className={`btn ${activeSubTab === 'supervisions' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveSubTab('supervisions')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}
        >
          <ClipboardList size={16} />
          บริหารจัดการการนิเทศ
        </button>
        <button 
          className={`btn ${activeSubTab === 'teachers' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveSubTab('teachers')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}
        >
          <Users size={16} />
          จัดการข้อมูลบุคลากร
        </button>
      </div>

      {activeSubTab === 'supervisions' && (
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
                          {req.date ? (
                            <>
                              <div>{formatThaiDate(req.date)}</div>
                              <div style={{ fontSize: '12px', color: 'var(--text-medium)' }}>เวลา {req.time}</div>
                            </>
                          ) : (
                            <span style={{ color: '#e67e22', fontWeight: 600, fontStyle: 'italic', fontSize: '12px' }}>
                              ⚠️ รอกำหนดวัน-เวลานิเทศ
                            </span>
                          )}
                        </td>
                        <td>
                          <a href={req.lessonPlanUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary-color)', textDecoration: 'underline' }}>
                            เปิดดูแผน
                          </a>
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            
                            {/* Academic Department Scheduling Section */}
                            <div style={{ backgroundColor: '#fdfefe', padding: '0.5rem', borderRadius: '4px', border: '1px dashed #d4efdf', marginBottom: '0.25rem' }}>
                              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--primary-color)', display: 'block', marginBottom: '0.25rem' }}>
                                📅 กำหนดตารางนิเทศ:
                              </span>
                              {editingScheduleId === req.id ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                  <div>
                                    <label style={{ fontSize: '10px', color: 'var(--text-medium)', display: 'block', marginBottom: '2px' }}>วันที่นิเทศ</label>
                                    <input 
                                      type="date" 
                                      value={schedDate}
                                      onChange={(e) => setSchedDate(e.target.value)}
                                      style={{ padding: '4px', fontSize: '12px', width: '100%', boxSizing: 'border-box' }}
                                    />
                                  </div>
                                  <div>
                                    <label style={{ fontSize: '10px', color: 'var(--text-medium)', display: 'block', marginBottom: '2px' }}>คาบเวลาเรียน</label>
                                    <select
                                      value={schedTime}
                                      onChange={(e) => setSchedTime(e.target.value)}
                                      style={{ padding: '4px', fontSize: '12px', width: '100%' }}
                                    >
                                      <option value="">-- เลือกคาบเรียน --</option>
                                      {PERIODS_LIST.map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                  </div>
                                  <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.25rem' }}>
                                    <button
                                      className="btn btn-primary"
                                      style={{ padding: '2px 6px', fontSize: '11px', flex: 1 }}
                                      onClick={async () => {
                                        if (!schedDate || !schedTime) {
                                          alert('กรุณาระบุทั้งวันและคาบเวลา');
                                          return;
                                        }
                                        const success = await onUpdateSupervision(req.id, { date: schedDate, time: schedTime });
                                        if (success) {
                                          alert('บันทึกวัน-เวลานิเทศเรียบร้อยแล้ว');
                                          setEditingScheduleId(null);
                                        } else {
                                          alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
                                        }
                                      }}
                                    >
                                      บันทึก
                                    </button>
                                    <button
                                      className="btn btn-outline"
                                      style={{ padding: '2px 6px', fontSize: '11px' }}
                                      onClick={() => setEditingScheduleId(null)}
                                    >
                                      ยกเลิก
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div style={{ display: 'flex', alignItems: 'center', justifyBetween: 'space-between', gap: '0.5rem' }}>
                                  <span style={{ fontSize: '12px', color: 'var(--text-dark)' }}>
                                    {req.date ? `${formatThaiDate(req.date)} (${req.time.split(' ')[0] || req.time})` : 'รอกำหนดวัน-เวลา'}
                                  </span>
                                  <button
                                    className="btn btn-outline"
                                    style={{ padding: '2px 6px', fontSize: '11px', whiteSpace: 'nowrap' }}
                                    onClick={() => {
                                      setEditingScheduleId(req.id);
                                      setSchedDate(req.date || '');
                                      setSchedTime(req.time || '');
                                    }}
                                  >
                                    {req.date ? 'แก้ไขเวลา' : 'ระบุเวลา'}
                                  </button>
                                </div>
                              )}
                            </div>

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
                        <td>
                          {editingScheduleId === req.id ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', minWidth: '150px' }}>
                              <div>
                                <label style={{ fontSize: '10px', color: 'var(--text-medium)', display: 'block', marginBottom: '2px' }}>วันที่นิเทศ</label>
                                <input 
                                  type="date" 
                                  value={schedDate}
                                  onChange={(e) => setSchedDate(e.target.value)}
                                  style={{ padding: '4px', fontSize: '12px', width: '100%', boxSizing: 'border-box' }}
                                />
                              </div>
                              <div>
                                <label style={{ fontSize: '10px', color: 'var(--text-medium)', display: 'block', marginBottom: '2px' }}>คาบเวลาเรียน</label>
                                <select
                                  value={schedTime}
                                  onChange={(e) => setSchedTime(e.target.value)}
                                  style={{ padding: '4px', fontSize: '12px', width: '100%' }}
                                >
                                  <option value="">-- เลือกคาบเรียน --</option>
                                  {PERIODS_LIST.map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                              </div>
                              <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.25rem' }}>
                                <button
                                  className="btn btn-primary"
                                  style={{ padding: '2px 6px', fontSize: '11px', flex: 1 }}
                                  onClick={async () => {
                                    if (!schedDate || !schedTime) {
                                      alert('กรุณาระบุทั้งวันและคาบเวลา');
                                      return;
                                    }
                                    const success = await onUpdateSupervision(req.id, { date: schedDate, time: schedTime });
                                    if (success) {
                                      alert('บันทึกวัน-เวลานิเทศเรียบร้อยแล้ว');
                                      setEditingScheduleId(null);
                                    } else {
                                      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
                                    }
                                  }}
                                >
                                  บันทึก
                                </button>
                                <button
                                  className="btn btn-outline"
                                  style={{ padding: '2px 6px', fontSize: '11px' }}
                                  onClick={() => setEditingScheduleId(null)}
                                >
                                  ยกเลิก
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                              <span>{formatThaiDate(req.date)} (เวลา {req.time.split(' ')[0] || req.time} น.)</span>
                              <button
                                className="btn btn-outline"
                                style={{ padding: '2px 6px', fontSize: '11px', whiteSpace: 'nowrap' }}
                                onClick={() => {
                                  setEditingScheduleId(req.id);
                                  setSchedDate(req.date || '');
                                  setSchedTime(req.time || '');
                                }}
                              >
                                แก้ไขเวลา
                              </button>
                            </div>
                          )}
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', minWidth: '180px' }}>
                            {req.supervisors && req.supervisors.length > 0 ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                {req.supervisors.map(s => (
                                  <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f1f1f1', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 500 }}>
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
                            ) : (
                              <span style={{ color: 'var(--text-light)', fontStyle: 'italic', fontSize: '12px' }}>ยังไม่ได้รับการแต่งตั้ง</span>
                            )}

                            {/* Dropdown to add more supervisors */}
                            <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.25rem' }}>
                              <select
                                value={selectedTeacherId[req.id] || ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setSelectedTeacherId(prev => ({ ...prev, [req.id]: val }));
                                }}
                                style={{ padding: '2px 4px', fontSize: '12px', flex: 1 }}
                              >
                                <option value="">+ แต่งตั้งผู้นิเทศ</option>
                                {teachers
                                  .filter(t => t.id !== req.teacherId && (!req.supervisors || !req.supervisors.some(sup => sup.id === t.id)))
                                  .map(t => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                  ))}
                              </select>
                              <button
                                className="btn btn-primary"
                                style={{ padding: '2px 6px', fontSize: '11px' }}
                                onClick={() => handleAssignClick(req.id)}
                              >
                                แต่งตั้ง
                              </button>
                            </div>
                          </div>
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
        </div>
      )}

      {activeSubTab === 'teachers' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
            {/* Add Teacher Card */}
            <div className="card">
              <h2 className="card-title">
                <UserPlus />
                เพิ่มข้อมูลบุคลากรครูใหม่
              </h2>
              
              {addError && (
                <div style={{ backgroundColor: '#fde8e8', color: '#e74c3c', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <AlertCircle size={14} />
                  {addError}
                </div>
              )}

              <form onSubmit={handleAddTeacherSubmit}>
                <div className="form-group">
                  <label>ชื่อ-นามสกุล ครูผู้สอน</label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="ตัวอย่าง: ครูสมชาย ดีงาม"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>ตำแหน่ง / กลุ่มสาระการเรียนรู้</label>
                  <input
                    type="text"
                    value={newPosition}
                    onChange={(e) => setNewPosition(e.target.value)}
                    placeholder="ตัวอย่าง: ครู ค.ศ. 2 (กลุ่มสาระวิทยาศาสตร์)"
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label>ชื่อผู้ใช้งาน (Username)</label>
                    <input
                      type="text"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      placeholder="ตัวอย่าง: somchai"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>รหัสผ่าน (Password)</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="ระบุรหัสผ่าน"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>บทบาทในระบบ (Role)</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    style={{ padding: '0.5rem' }}
                  >
                    <option value="teacher">ครูผู้สอนทั่วไป (Teacher)</option>
                    <option value="admin">ผู้นิเทศ/ผู้บริหาร/ฝ่ายวิชาการ (Admin)</option>
                  </select>
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem' }}>
                  บันทึกข้อมูลบุคลากร
                </button>
              </form>
            </div>

            {/* Teacher Directory Card */}
            <div className="card" style={{ flex: 2 }}>
              <h2 className="card-title">
                <Users />
                ทำเนียบข้อมูลบุคลากรครูในระบบ ({teachers.length} ท่าน)
              </h2>
              
              <div className="table-responsive">
                <table>
                  <thead>
                    <tr>
                      <th>ชื่อ-นามสกุล</th>
                      <th>บทบาท</th>
                      <th>ตำแหน่ง / สังกัดกลุ่มสาระ</th>
                      <th>ชื่อผู้ใช้งาน</th>
                      <th>รหัสผ่าน</th>
                      <th style={{ textAlign: 'center' }}>การจัดการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teachers.map((t) => (
                      <tr key={t.id}>
                        <td style={{ fontWeight: 600 }}>{t.name}</td>
                        <td>
                          <span style={{ fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.2rem 0.5rem', borderRadius: '30px', backgroundColor: t.role === 'admin' ? '#fef3c7' : '#e0f2fe', color: t.role === 'admin' ? '#b45309' : '#0369a1', fontWeight: 600 }}>
                            {t.role === 'admin' ? <Shield size={10} /> : <Users size={10} />}
                            {t.role === 'admin' ? 'ฝ่ายบริหาร/วิชาการ' : 'ครูผู้สอน'}
                          </span>
                        </td>
                        <td style={{ fontSize: '13px' }}>{t.position}</td>
                        <td style={{ fontFamily: 'monospace', fontSize: '13px' }}>{t.username}</td>
                        <td style={{ fontFamily: 'monospace', fontSize: '13px' }}>{t.password}</td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            className="btn btn-outline btn-danger"
                            style={{ padding: '0.25rem 0.5rem', fontSize: '11px', color: '#e74c3c', borderColor: '#e74c3c', display: 'inline-flex', gap: '0.25rem', alignItems: 'center' }}
                            onClick={() => handleDeleteTeacherClick(t)}
                            disabled={t.username === 'academic' || t.username === 'admin'}
                          >
                            <Trash2 size={12} /> ลบรายชื่อ
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

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
