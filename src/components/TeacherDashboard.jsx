import React, { useState } from 'react';
import { 
  BookOpen, 
  Calendar as CalendarIcon, 
  ClipboardList, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Send, 
  User, 
  ChevronRight, 
  Clock,
  Trash2,
  Edit,
  FolderOpen,
  Plus
} from 'lucide-react';
import EvaluationModal from './EvaluationModal';
import EvaluationSummaryModal from './EvaluationSummaryModal';

const PERIODS_LIST = [
  'คาบที่ 1 (08.30 - 09.20 น.)',
  'คาบที่ 2 (09.20 - 10.10 น.)',
  'คาบที่ 3 (10.20 - 11.10 น.)',
  'คาบที่ 4 (11.10 - 12.00 น.)',
  'คาบที่ 5 (13.00 - 13.50 น.)',
  'คาบที่ 6 (13.50 - 14.40 น.)',
  'คาบที่ 7 (14.40 - 15.30 น.)'
];

export default function TeacherDashboard({
  currentUser,
  supervisions,
  onAddSupervision,
  onVolunteer,
  onSubmitPostRecord,
  onDeleteSupervision,
  onUpdateSupervision,
  termPlans = [],
  onRegisterTermPlan,
  onUpdateTermPlan,
  onDeleteTermPlan
}) {
  const [activeTab, setActiveTab] = useState('request');

  // 1. Request Supervision Form States
  const [subject, setSubject] = useState('');
  const [grade, setGrade] = useState('ม.1');
  const [room, setRoom] = useState('1');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [planUrl, setPlanUrl] = useState('');
  const [requestError, setRequestError] = useState('');
  const [requestSuccess, setRequestSuccess] = useState('');

  // 2. Term Lesson Plan Form States
  const [termYear, setTermYear] = useState('2569');
  const [termSemester, setTermSemester] = useState('1');
  const [termSubjectCode, setTermSubjectCode] = useState('');
  const [termSubjectName, setTermSubjectName] = useState('');
  const [termGrade, setTermGrade] = useState('ม.1');
  const [termPlanUrl, setTermPlanUrl] = useState('');
  const [termError, setTermError] = useState('');
  const [termSuccess, setTermSuccess] = useState('');

  // 3. Modals and Editors States
  // A. Post Teaching Record Form States
  const [selectedSupervision, setSelectedSupervision] = useState(null);
  const [studentOutcome, setStudentOutcome] = useState('');
  const [problems, setProblems] = useState('');
  const [solutions, setSolutions] = useState('');

  // B. Edit Supervision Request Form States
  const [editingSupervision, setEditingSupervision] = useState(null);
  const [editSubject, setEditSubject] = useState('');
  const [editGrade, setEditGrade] = useState('ม.1');
  const [editRoom, setEditRoom] = useState('1');
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editPlanUrl, setEditPlanUrl] = useState('');

  // C. Post Lesson Record for Term Plan States
  const [selectedTermPlan, setSelectedTermPlan] = useState(null);
  const [postLessonOutcome, setPostLessonOutcome] = useState('');

  // D. Classroom Evaluation Form States
  const [selectedEvalSupervision, setSelectedEvalSupervision] = useState(null);

  // E. Summary Report State
  const [selectedReportSummary, setSelectedReportSummary] = useState(null);

  // Handle Supervision Request Submit
  const handleRequestSubmit = (e) => {
    e.preventDefault();
    if (!subject || !planUrl) {
      setRequestError('กรุณากรอกข้อมูลให้ครบถ้วนทุกช่อง');
      return;
    }
    
    onAddSupervision({
      teacherId: currentUser.id,
      teacherName: currentUser.name,
      subject,
      grade,
      room,
      date: '', // Academic Department will schedule this
      time: '', // Academic Department will schedule this
      lessonPlanUrl: planUrl
    });

    setSubject('');
    setPlanUrl('');
    setRequestError('');
    setRequestSuccess('ส่งคำขอและอัปโหลดแผนการสอนเรียบร้อยแล้ว! ฝ่ายวิชาการจะเป็นผู้กำหนดวันและเวลานิเทศการสอน');
    setTimeout(() => setRequestSuccess(''), 5000);
  };

  // Handle Edit Supervision Submit
  const handleEditSupervisionSubmit = async (e) => {
    e.preventDefault();
    if (!editSubject || !editPlanUrl) {
      alert('กรุณากรอกข้อมูลให้ครบทุกช่อง');
      return;
    }

    const success = await onUpdateSupervision(editingSupervision.id, {
      subject: editSubject,
      grade: editGrade,
      room: editRoom,
      lessonPlanUrl: editPlanUrl
    });

    if (success) {
      alert('แก้ไขข้อมูลการจองเวลาเรียบร้อยแล้ว');
      setEditingSupervision(null);
    } else {
      alert('เกิดข้อผิดพลาดในการแก้ไขข้อมูล กรุณาลองใหม่อีกครั้ง');
    }
  };

  // Handle Delete Supervision
  const handleDeleteSupervisionClick = async (supervisionId) => {
    if (window.confirm('คุณแน่ใจหรือไม่ที่จะลบคำขอรับการนิเทศการสอนนี้? รายการจองคาบและข้อมูลทั้งหมดจะถูกลบออกจากระบบออนไลน์')) {
      const success = await onDeleteSupervision(supervisionId);
      if (success) {
        alert('ลบคำขอเรียบร้อยแล้ว');
      } else {
        alert('เกิดข้อผิดพลาดในการลบข้อมูล กรุณาลองใหม่อีกครั้ง');
      }
    }
  };

  // Handle Post Teaching Record Submit
  const handlePostRecordSubmit = (e) => {
    e.preventDefault();
    if (!studentOutcome || !problems || !solutions) {
      alert('กรุณากรอกข้อมูลให้ครบทุกหัวข้อ');
      return;
    }

    onSubmitPostRecord(selectedSupervision.id, {
      studentOutcome,
      problems,
      solutions
    });

    setSelectedSupervision(null);
    setStudentOutcome('');
    setProblems('');
    setSolutions('');
    alert('บันทึกหลังการสอนเสร็จสิ้นและปรับปรุงข้อมูลเรียบร้อย!');
  };

  // Handle Classroom Evaluation Submit handled by imported component

  // Handle Term Plan Submit
  const handleTermPlanSubmit = async (e) => {
    e.preventDefault();
    setTermError('');
    setTermSuccess('');

    if (!termSubjectCode || !termSubjectName || !termPlanUrl) {
      setTermError('กรุณากรอกข้อมูลให้ครบถ้วนทุกช่อง');
      return;
    }

    const success = await onRegisterTermPlan({
      teacherId: currentUser.id,
      teacherName: currentUser.name,
      academicYear: termYear,
      term: termSemester,
      subjectCode: termSubjectCode.trim().toUpperCase(),
      subjectName: termSubjectName.trim(),
      grade: termGrade,
      lessonPlanUrl: termPlanUrl.trim()
    });

    if (success) {
      setTermSubjectCode('');
      setTermSubjectName('');
      setTermPlanUrl('');
      setTermSuccess('อัปโหลดและบันทึกแผนการจัดการเรียนรู้ประจำภาคเรียนเรียบร้อยแล้ว!');
      setTimeout(() => setTermSuccess(''), 4000);
    } else {
      setTermError('เกิดข้อผิดพลาดในการส่งแผนการสอน กรุณาลองใหม่อีกครั้ง');
    }
  };

  // Handle Post Lesson Feedback Submit
  const handlePostLessonSubmit = async (e) => {
    e.preventDefault();
    if (!postLessonOutcome) {
      alert('กรุณากรอกข้อเสนอแนะ/บันทึกหลังสอน');
      return;
    }

    const success = await onUpdateTermPlan(selectedTermPlan.id, {
      postLessonRecord: {
        outcome: postLessonOutcome,
        submittedAt: new Date().toISOString()
      }
    });

    if (success) {
      alert('บันทึกหลังแผนการจัดการเรียนรู้สำเร็จเรียบร้อยแล้ว');
      setSelectedTermPlan(null);
      setPostLessonOutcome('');
    } else {
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง');
    }
  };

  // Handle Delete Term Plan Click
  const handleDeleteTermPlanClick = async (planId, subjectName) => {
    if (window.confirm(`คุณแน่ใจหรือไม่ที่จะลบแผนการสอนรายวิชา: ${subjectName}? ข้อมูลไฟล์และบันทึกหลังแผนจะถูกนำออกจากคลัง`)) {
      const success = await onDeleteTermPlan(planId);
      if (success) {
        alert('ลบแผนการสอนประจำเทอมเรียบร้อยแล้ว');
      } else {
        alert('เกิดข้อผิดพลาดในการลบแผนการสอน กรุณาลองใหม่อีกครั้ง');
      }
    }
  };

  // Filtering data subsets
  const myRequests = supervisions.filter(s => s.teacherId === currentUser.id);
  const myTermPlans = termPlans.filter(tp => tp.teacherId === currentUser.id);
  
  // Supervisions of other teachers open for volunteering
  const openForVolunteering = supervisions.filter(
    s => s.teacherId !== currentUser.id && 
         (s.status === 'pending' || (s.supervisors && s.supervisors.length < 2)) &&
         (!s.supervisors || !s.supervisors.some(sup => sup.id === currentUser.id)) &&
         s.status !== 'completed' &&
         s.status !== 'pending_approval'
  );

  // My volunteered items waiting or approved
  const myVolunteeredSupervisions = supervisions.filter(
    s => (s.supervisors && s.supervisors.some(sup => sup.id === currentUser.id)) || s.volunteerId === currentUser.id
  );

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

  // Helper functions handled by imported components

  return (
    <div>
      {/* Tabs Menu */}
      <div className="tab-container">
        <button
          className={`tab-btn ${activeTab === 'request' ? 'active' : ''}`}
          onClick={() => setActiveTab('request')}
        >
          <BookOpen size={18} />
          ขอรับการนิเทศการสอน & อัปโหลดแผนการเรียนรู้
        </button>
        <button
          className={`tab-btn ${activeTab === 'term-plans' ? 'active' : ''}`}
          onClick={() => setActiveTab('term-plans')}
        >
          <FolderOpen size={18} />
          ส่งแผนการจัดการเรียนรู้ประจำภาคเรียน
        </button>
        <button
          className={`tab-btn ${activeTab === 'my-supervisions' ? 'active' : ''}`}
          onClick={() => setActiveTab('my-supervisions')}
        >
          <ClipboardList size={18} />
          กำหนดการและการนิเทศของฉัน ({myRequests.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'volunteer' ? 'active' : ''}`}
          onClick={() => setActiveTab('volunteer')}
        >
          <User size={18} />
          เสนอความจำนงเป็นผู้นิเทศการสอน ({openForVolunteering.length})
        </button>
      </div>

      {/* Tab 1: Request Supervision & Upload Plan */}
      {activeTab === 'request' && (
        <div className="card">
          <h2 className="card-title">
            <BookOpen />
            แบบจองเวลานิเทศการเรียนการสอนรายบุคคล
          </h2>
          
          {requestError && (
            <div style={{ backgroundColor: '#fde8e8', color: '#e74c3c', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '14px' }}>
              <AlertCircle size={18} />
              {requestError}
            </div>
          )}

          {requestSuccess && (
            <div style={{ backgroundColor: '#eafaf1', color: '#27ae60', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '14px' }}>
              <CheckCircle2 size={18} />
              {requestSuccess}
            </div>
          )}

          <form onSubmit={handleRequestSubmit}>
            <div className="form-group">
              <label>ชื่อวิชา / รหัสวิชา (ตามหลักสูตรสถานศึกษา)</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="เช่น คณิตศาสตร์เพิ่มเติม (ค31201) หรือ ภาษาอังกฤษพื้นฐาน"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>ระดับชั้นเรียน</label>
                <select value={grade} onChange={(e) => setGrade(e.target.value)}>
                  <option value="ม.1">มัธยมศึกษาปีที่ 1</option>
                  <option value="ม.2">มัธยมศึกษาปีที่ 2</option>
                  <option value="ม.3">มัธยมศึกษาปีที่ 3</option>
                  <option value="ม.4">มัธยมศึกษาปีที่ 4</option>
                  <option value="ม.5">มัธยมศึกษาปีที่ 5</option>
                  <option value="ม.6">มัธยมศึกษาปีที่ 6</option>
                </select>
              </div>

              <div className="form-group">
                <label>ห้องเรียนปฏิบัติการ</label>
                <select value={room} onChange={(e) => setRoom(e.target.value)}>
                  <option value="1">ห้อง 1</option>
                  <option value="2">ห้อง 2</option>
                  <option value="3">ห้อง 3</option>
                  <option value="4">ห้อง 4</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>ลิงก์เอกสารแผนการจัดการเรียนรู้คาบที่นิเทศ (Google Drive / PDF / ลิงก์สาธารณะ)</label>
              <input
                type="text"
                value={planUrl}
                onChange={(e) => setPlanUrl(e.target.value)}
                placeholder="https://docs.google.com/document/d/..."
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
              <Send size={18} />
              บันทึกการจองเวลาและส่งแผนจัดการเรียนรู้รายบุคคล
            </button>
          </form>
        </div>
      )}

      {/* Tab 2: Register Term-long Lesson Plans */}
      {activeTab === 'term-plans' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
          {/* Submit Form Card */}
          <div className="card">
            <h2 className="card-title">
              <Plus />
              ส่งแผนการจัดการเรียนรู้ประจำภาคเรียน
            </h2>

            {termError && (
              <div style={{ backgroundColor: '#fde8e8', color: '#e74c3c', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '13px' }}>
                <AlertCircle size={14} />
                {termError}
              </div>
            )}

            {termSuccess && (
              <div style={{ backgroundColor: '#eafaf1', color: '#27ae60', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '13px' }}>
                <CheckCircle2 size={14} />
                {termSuccess}
              </div>
            )}

            <form onSubmit={handleTermPlanSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label>ปีการศึกษา</label>
                  <select value={termYear} onChange={(e) => setTermYear(e.target.value)}>
                    <option value="2569">2569</option>
                    <option value="2568">2568</option>
                    <option value="2567">2567</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>ภาคเรียนที่</label>
                  <select value={termSemester} onChange={(e) => setTermSemester(e.target.value)}>
                    <option value="1">1</option>
                    <option value="2">2</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label>รหัสวิชา</label>
                  <input 
                    type="text" 
                    value={termSubjectCode} 
                    onChange={(e) => setTermSubjectCode(e.target.value)} 
                    placeholder="เช่น ค21101" 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>ระดับชั้นเรียน</label>
                  <select value={termGrade} onChange={(e) => setTermGrade(e.target.value)}>
                    <option value="ม.1">ม.1</option>
                    <option value="ม.2">ม.2</option>
                    <option value="ม.3">ม.3</option>
                    <option value="ม.4">ม.4</option>
                    <option value="ม.5">ม.5</option>
                    <option value="ม.6">ม.6</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>ชื่อรายวิชา</label>
                <input 
                  type="text" 
                  value={termSubjectName} 
                  onChange={(e) => setTermSubjectName(e.target.value)} 
                  placeholder="เช่น ภาษาอังกฤษพื้นฐาน" 
                  required 
                />
              </div>

              <div className="form-group">
                <label>ลิงก์แผนการจัดการเรียนรู้ประจำเทอม (Google Drive)</label>
                <input 
                  type="text" 
                  value={termPlanUrl} 
                  onChange={(e) => setTermPlanUrl(e.target.value)} 
                  placeholder="https://drive.google.com/drive/folders/..." 
                  required 
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem' }}>
                <Send size={16} /> ส่งแผนประจำเทอม
              </button>
            </form>
          </div>

          {/* Submitted Term Plans Directory Card */}
          <div className="card">
            <h2 className="card-title">
              <FolderOpen />
              คลังแผนการจัดเรียนรู้ประจำภาคเรียนของคุณ ({myTermPlans.length} รายการ)
            </h2>

            {myTermPlans.length === 0 ? (
              <p style={{ color: 'var(--text-light)', textAlign: 'center', padding: '3rem', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
                คุณยังไม่ได้ส่งแผนการเรียนรู้ประจำภาคเรียนในระบบ
              </p>
            ) : (
              <div className="table-responsive">
                <table>
                  <thead>
                    <tr>
                      <th>ปีการศึกษา/ภาคเรียน</th>
                      <th>รายวิชา</th>
                      <th>ลิงก์แผน</th>
                      <th>บันทึกหลังสอน</th>
                      <th style={{ textAlign: 'center' }}>การจัดการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myTermPlans.map((plan) => (
                      <tr key={plan.id}>
                        <td>ภาคเรียน {plan.term}/{plan.academicYear}</td>
                        <td>
                          <span style={{ fontWeight: 600, color: 'var(--primary-color)' }}>{plan.subjectCode}</span> <br />
                          <span style={{ fontSize: '13px' }}>{plan.subjectName} (ชั้น ม.{plan.grade.replace('ม.', '')})</span>
                        </td>
                        <td>
                          <a href={plan.lessonPlanUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline" style={{ padding: '0.2rem 0.4rem', fontSize: '11px' }}>
                            เปิดแผน
                          </a>
                        </td>
                        <td>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '0.2rem 0.5rem', fontSize: '11px', whiteSpace: 'nowrap' }}
                            onClick={() => {
                              setSelectedTermPlan(plan);
                              setPostLessonOutcome(plan.postLessonRecord?.outcome || '');
                            }}
                          >
                            {plan.postLessonRecord ? 'ดู/แก้ไขหลังแผน' : 'เขียนหลังแผน'}
                          </button>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            className="btn btn-outline btn-danger"
                            style={{ padding: '0.2rem 0.4rem', fontSize: '11px', color: '#e74c3c', borderColor: '#e74c3c' }}
                            onClick={() => handleDeleteTermPlanClick(plan.id, plan.subjectName)}
                          >
                            <Trash2 size={12} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Modal Write Post-Lesson Feedback */}
          {selectedTermPlan && (
            <div className="modal-overlay">
              <div className="modal-content" style={{ maxWidth: '500px' }}>
                <div className="modal-header">
                  <h3>บันทึกข้อเสนอแนะ/รายงานหลังแผนการจัดการเรียนรู้</h3>
                  <button className="modal-close-btn" onClick={() => setSelectedTermPlan(null)}>×</button>
                </div>
                <form onSubmit={handlePostLessonSubmit}>
                  <div className="modal-body">
                    <div style={{ backgroundColor: 'var(--primary-light)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontSize: '13px' }}>
                      <strong>รายวิชา:</strong> {selectedTermPlan.subjectCode} {selectedTermPlan.subjectName} (ชั้น ม.{selectedTermPlan.grade.replace('ม.', '')}) <br />
                      <strong>ปีการศึกษา/ภาคเรียน:</strong> {selectedTermPlan.term}/{selectedTermPlan.academicYear}
                    </div>

                    <div className="form-group">
                      <label>บันทึกรายงาน/ข้อเสนอแนะหลังการจัดกิจกรรมการเรียนรู้ (Outcome)</label>
                      <textarea
                        rows="6"
                        value={postLessonOutcome}
                        onChange={(e) => setPostLessonOutcome(e.target.value)}
                        placeholder="ระบุสรุปผลการจัดกิจกรรม ปัญหาที่พบบ่อย และข้อค้นพบ/รายงานหลังแผน..."
                        required
                      ></textarea>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-outline" onClick={() => setSelectedTermPlan(null)}>ยกเลิก</button>
                    <button type="submit" className="btn btn-primary">บันทึกข้อมูล</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: My Supervisions */}
      {activeTab === 'my-supervisions' && (
        <div className="card">
          <h2 className="card-title">
            <ClipboardList />
            รายการคำขอและการจองวันเวลานิเทศการสอนของคุณ
          </h2>

          {myRequests.length === 0 ? (
            <p style={{ color: 'var(--text-light)', textAlign: 'center', padding: '2rem' }}>ไม่พบข้อมูลกำหนดการนิเทศการสอน</p>
          ) : (
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>รายวิชา</th>
                    <th>ระดับชั้น/ห้องเรียน</th>
                    <th>วัน-เวลาที่นิเทศ</th>
                    <th>แผนการสอน</th>
                    <th>คณะกรรมการนิเทศ</th>
                    <th>สถานะ</th>
                    <th>รายงานผล</th>
                    <th style={{ textAlign: 'center' }}>การจัดการการจอง</th>
                  </tr>
                </thead>
                <tbody>
                  {myRequests.map((req) => (
                    <tr key={req.id}>
                      <td style={{ fontWeight: 600 }}>{req.subject}</td>
                      <td>ชั้น ม.{req.grade.replace('ม.', '')}/{req.room}</td>
                      <td>
                        {req.date ? (
                          <>
                            <div style={{ fontSize: '13px', fontWeight: 500 }}>{formatThaiDate(req.date)}</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-medium)' }}>เวลา {req.time}</div>
                          </>
                        ) : (
                          <span style={{ fontSize: '12px', color: '#e67e22', fontWeight: 600, fontStyle: 'italic' }}>
                            ⚠️ รอกำหนดวัน-เวลาจากฝ่ายวิชาการ
                          </span>
                        )}
                      </td>
                      <td>
                        <a href={req.lessonPlanUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline" style={{ padding: '0.2rem 0.5rem', fontSize: '12px', display: 'inline-flex', gap: '0.25rem' }}>
                          <FileText size={12} /> เปิดแผนการสอน
                        </a>
                      </td>
                      <td style={{ fontWeight: 500 }}>
                        {req.supervisors && req.supervisors.length > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '12px' }}>
                            {req.supervisors.map(s => <span key={s.id}>• {s.name}</span>)}
                            {req.supervisors.length < 2 && (
                              <span style={{ color: '#e74c3c', fontSize: '11px', fontWeight: 600 }}>
                                (ต้องการผู้นิเทศอีก {2 - req.supervisors.length} ท่าน)
                              </span>
                            )}
                          </div>
                        ) : req.status === 'pending_approval' ? (
                          <span style={{ color: 'var(--secondary-hover)', fontSize: '12px', fontWeight: 600 }}>
                            รอพิจารณาคำขอเสนอตัว ({req.volunteerName})
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-light)', fontSize: '12px', fontStyle: 'italic' }}>อยู่ระหว่างจัดสรร</span>
                        )}
                      </td>
                      <td>
                        <span className={`badge badge-${req.status}`}>
                          {req.status === 'pending' && 'อยู่ระหว่างจัดสรรคณะกรรมการ'}
                          {req.status === 'pending_approval' && 'อยู่ระหว่างพิจารณาผู้เสนอความจำนง'}
                          {req.status === 'approved' && 'แต่งตั้งคณะกรรมการเสร็จสิ้น'}
                          {req.status === 'completed' && 'รายงานผลเสร็จสิ้น'}
                        </span>
                      </td>
                      <td>
                        {req.status === 'approved' && (
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '0.3rem 0.6rem', fontSize: '12px', whiteSpace: 'nowrap' }}
                            onClick={() => {
                              setSelectedSupervision(req);
                              setStudentOutcome(req.postTeachingRecord?.studentOutcome || '');
                              setProblems(req.postTeachingRecord?.problems || '');
                              setSolutions(req.postTeachingRecord?.solutions || '');
                            }}
                          >
                            รายงานบันทึกหลังสอน
                          </button>
                        )}
                        {req.status === 'completed' && (
                          <button
                            className="btn btn-outline"
                            style={{ padding: '0.3rem 0.6rem', fontSize: '12px', whiteSpace: 'nowrap' }}
                            onClick={() => {
                              setSelectedSupervision(req);
                              setStudentOutcome(req.postTeachingRecord.studentOutcome);
                              setProblems(req.postTeachingRecord.problems);
                              setSolutions(req.postTeachingRecord.solutions);
                            }}
                          >
                            ดู/แก้ไขรายงานผล
                          </button>
                        )}
                        {req.status === 'pending' && (
                          <span style={{ fontSize: '12px', color: 'var(--text-light)', fontStyle: 'italic' }}>
                            รอแต่งตั้งผู้นิเทศครบก่อนรายงาน
                          </span>
                        )}
                        {req.status === 'pending_approval' && (
                          <span style={{ fontSize: '12px', color: 'var(--text-light)', fontStyle: 'italic' }}>รอแต่งตั้งเสร็จสิ้น</span>
                        )}
                        {req.evaluations && Object.keys(req.evaluations).length > 0 && (
                          <button
                            type="button"
                            className="btn btn-outline"
                            style={{ padding: '0.3rem 0.6rem', fontSize: '12px', whiteSpace: 'nowrap', marginTop: '0.35rem', display: 'block', borderColor: 'var(--primary-color)', color: 'var(--primary-color)' }}
                            onClick={() => {
                              setSelectedReportSummary(req);
                            }}
                          >
                            📊 ดูผลประเมิน ({Object.keys(req.evaluations).length} ท่าน)
                          </button>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'center' }}>
                          <button
                            className="btn btn-outline"
                            style={{ padding: '0.3rem 0.5rem', fontSize: '12px', color: 'var(--primary-color)', borderColor: 'var(--primary-color)', display: 'inline-flex', alignItems: 'center' }}
                            onClick={() => {
                              setEditingSupervision(req);
                              setEditSubject(req.subject);
                              setEditGrade(req.grade);
                              setEditRoom(req.room);
                              setEditDate(req.date);
                              setEditTime(req.time);
                              setEditPlanUrl(req.lessonPlanUrl);
                            }}
                          >
                            <Edit size={12} /> แก้ไข
                          </button>
                          <button
                            className="btn btn-outline btn-danger"
                            style={{ padding: '0.3rem 0.5rem', fontSize: '12px', color: '#e74c3c', borderColor: '#e74c3c', display: 'inline-flex', alignItems: 'center' }}
                            onClick={() => handleDeleteSupervisionClick(req.id)}
                          >
                            <Trash2 size={12} /> ลบ
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Modal Write Post-Teaching Record */}
          {selectedSupervision && (
            <div className="modal-overlay">
              <div className="modal-content">
                <div className="modal-header">
                  <h3>
                    บันทึกรายงานผลหลังการจัดการเรียนรู้: รายวิชา {selectedSupervision.subject}
                  </h3>
                  <button className="modal-close-btn" onClick={() => setSelectedSupervision(null)}>×</button>
                </div>
                <form onSubmit={handlePostRecordSubmit}>
                  <div className="modal-body">
                    <div style={{ backgroundColor: 'var(--primary-light)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.25rem', fontSize: '13px' }}>
                      <strong>ระดับชั้นเรียน:</strong> ชั้นมัธยมศึกษาปีที่ {selectedSupervision.grade.replace('ม.', '')}/{selectedSupervision.room} | 
                      <strong> วันที่จัดกิจกรรม:</strong> {formatThaiDate(selectedSupervision.date)} เวลา {selectedSupervision.time} <br />
                      <strong>คณะกรรมการนิเทศ:</strong> {selectedSupervision.supervisors ? selectedSupervision.supervisors.map(s => s.name).join(', ') : 'ยังไม่ระบุ'}
                    </div>

                    <div className="form-group">
                      <label>1. ผลการจัดการเรียนรู้ (การบรรลุจุดประสงค์การเรียนรู้และสมรรถนะผู้เรียน)</label>
                      <textarea
                        rows="3"
                        value={studentOutcome}
                        onChange={(e) => setStudentOutcome(e.target.value)}
                        placeholder="กรอกผลสำเร็จและคุณภาพของผู้เรียนจากการจัดกิจกรรมการเรียนรู้..."
                        required
                      ></textarea>
                    </div>

                    <div className="form-group">
                      <label>2. ปัญหาและอุปสรรค (ด้านการจัดกิจกรรม สื่อ/อุปกรณ์ หรือพฤติกรรมผู้เรียน)</label>
                      <textarea
                        rows="3"
                        value={problems}
                        onChange={(e) => setProblems(e.target.value)}
                        placeholder="กรอกข้อขัดข้อง ปัญหา และอุปสรรคในการจัดการเรียนรู้..."
                        required
                      ></textarea>
                    </div>

                    <div className="form-group">
                      <label>3. ข้อเสนอแนะและแนวทางแก้ไข (การปรับปรุงสำหรับการจัดกิจกรรมครั้งถัดไป)</label>
                      <textarea
                        rows="3"
                        value={solutions}
                        onChange={(e) => setSolutions(e.target.value)}
                        placeholder="กรอกแนวทางการแก้ไข ปรับปรุง หรือวิธีการพัฒนาการเรียนรู้..."
                        required
                      ></textarea>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-outline" onClick={() => setSelectedSupervision(null)}>ยกเลิก</button>
                    <button type="submit" className="btn btn-primary">บันทึกรายงานผล</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Modal Edit Supervision Request */}
          {editingSupervision && (
            <div className="modal-overlay">
              <div className="modal-content" style={{ maxWidth: '520px' }}>
                <div className="modal-header">
                  <h3>แก้ไขข้อมูลคำขอรับการนิเทศการสอน</h3>
                  <button className="modal-close-btn" onClick={() => setEditingSupervision(null)}>×</button>
                </div>
                <form onSubmit={handleEditSupervisionSubmit}>
                  <div className="modal-body">
                    <div className="form-group">
                      <label>ชื่อวิชา / รหัสวิชา (ตามหลักสูตรสถานศึกษา)</label>
                      <input
                        type="text"
                        value={editSubject}
                        onChange={(e) => setEditSubject(e.target.value)}
                        required
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      <div className="form-group">
                        <label>ระดับชั้นเรียน</label>
                        <select value={editGrade} onChange={(e) => setEditGrade(e.target.value)}>
                          <option value="ม.1">มัธยมศึกษาปีที่ 1</option>
                          <option value="ม.2">มัธยมศึกษาปีที่ 2</option>
                          <option value="ม.3">มัธยมศึกษาปีที่ 3</option>
                          <option value="ม.4">มัธยมศึกษาปีที่ 4</option>
                          <option value="ม.5">มัธยมศึกษาปีที่ 5</option>
                          <option value="ม.6">มัธยมศึกษาปีที่ 6</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label>ห้องเรียนปฏิบัติการ</label>
                        <select value={editRoom} onChange={(e) => setEditRoom(e.target.value)}>
                          <option value="1">ห้อง 1</option>
                          <option value="2">ห้อง 2</option>
                          <option value="3">ห้อง 3</option>
                          <option value="4">ห้อง 4</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-group">
                      <label>ลิงก์แผนการจัดการเรียนรู้ (Google Drive / ลิงก์สาธารณะ)</label>
                      <input
                        type="text"
                        value={editPlanUrl}
                        onChange={(e) => setEditPlanUrl(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-outline" onClick={() => setEditingSupervision(null)}>ยกเลิก</button>
                    <button type="submit" className="btn btn-primary">บันทึกการแก้ไข</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Volunteer & Volunteer Status */}
      {activeTab === 'volunteer' && (
        <div>
          {/* Section A: Open list */}
          <div className="card">
            <h2 className="card-title">
              <User />
              กำหนดการนิเทศการสอนที่เปิดรับการเสนอความจำนงเป็นผู้นิเทศ
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-medium)', marginBottom: '1rem' }}>
              ครูผู้สอนสามารถเสนอความจำนงเป็นผู้นิเทศการสอนสำหรับวิชาของเพื่อนครูที่ยังแต่งตั้งผู้นิเทศไม่ครบถ้วนได้ โดยการแต่งตั้งจะมีผลสมบูรณ์เมื่อได้รับการอนุมัติจากฝ่ายวิชาการ
            </p>

            {openForVolunteering.length === 0 ? (
              <p style={{ color: 'var(--text-light)', textAlign: 'center', padding: '1.5rem', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
                ไม่พบกำหนดการนิเทศที่เปิดรับเสนอความจำนงในขณะนี้
              </p>
            ) : (
              <div className="table-responsive">
                <table>
                  <thead>
                    <tr>
                      <th>ครูผู้รับการนิเทศ</th>
                      <th>รายวิชา</th>
                      <th>ระดับชั้น/ห้องเรียน</th>
                      <th>วัน-เวลาที่นิเทศ</th>
                      <th>แผนการจัดการเรียนรู้</th>
                      <th>การดำเนินงาน</th>
                    </tr>
                  </thead>
                  <tbody>
                    {openForVolunteering.map((req) => (
                      <tr key={req.id}>
                        <td style={{ fontWeight: 600 }}>{req.teacherName}</td>
                        <td>{req.subject}</td>
                        <td>ชั้น ม.{req.grade.replace('ม.', '')}/{req.room}</td>
                        <td>{formatThaiDate(req.date)} (เวลา {req.time})</td>
                        <td>
                          <a href={req.lessonPlanUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary-color)', textDecoration: 'underline' }}>
                            เปิดแผนการจัดการเรียนรู้
                          </a>
                        </td>
                        <td>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '0.4rem 0.8rem', fontSize: '13px' }}
                            onClick={() => onVolunteer(req.id)}
                          >
                            เสนอความจำนงเป็นผู้นิเทศ
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Section B: My Volunteered Tasks */}
          <div className="card">
            <h2 className="card-title">
              <CalendarIcon />
              กำหนดการปฏิบัติหน้าที่ผู้นิเทศของคุณ (ได้รับการแต่งตั้ง / อยู่ระหว่างรออนุมัติ)
            </h2>

            {myVolunteeredSupervisions.length === 0 ? (
              <p style={{ color: 'var(--text-light)', textAlign: 'center', padding: '1.5rem' }}>ไม่พบประวัติการเสนอความจำนงหรือภาระงานนิเทศการสอนของท่านในขณะนี้</p>
            ) : (
              <div className="table-responsive">
                <table>
                  <thead>
                    <tr>
                      <th>ครูผู้สอน</th>
                      <th>รายวิชา</th>
                      <th>ระดับชั้น/ห้องเรียน</th>
                      <th>วัน-เวลาที่นิเทศ</th>
                      <th>แผนการจัดการเรียนรู้</th>
                      <th>สถานะการพิจารณา</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myVolunteeredSupervisions.map((req) => {
                      const isApproved = req.supervisors && req.supervisors.some(sup => sup.id === currentUser.id);
                      return (
                        <tr key={req.id}>
                          <td style={{ fontWeight: 600 }}>{req.teacherName}</td>
                          <td>{req.subject}</td>
                          <td>ชั้น ม.{req.grade.replace('ม.', '')}/{req.room}</td>
                          <td>{formatThaiDate(req.date)} (เวลา {req.time})</td>
                          <td>
                            <a href={req.lessonPlanUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary-color)', textDecoration: 'underline' }}>
                              แผนการจัดการเรียนรู้
                            </a>
                          </td>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', alignItems: 'center' }}>
                              {isApproved ? (
                                <>
                                  <span className="badge badge-approved" style={{ padding: '0.4rem 0.8rem', display: 'inline-flex', gap: '0.25rem', alignItems: 'center' }}>
                                    <CheckCircle2 size={12} /> ได้รับการแต่งตั้งเป็นผู้นิเทศแล้ว
                                  </span>
                                  {req.date && (
                                    <button
                                      type="button"
                                      className="btn btn-secondary"
                                      style={{ padding: '0.25rem 0.5rem', fontSize: '11px', whiteSpace: 'nowrap', marginTop: '0.25rem' }}
                                      onClick={() => {
                                        setSelectedEvalSupervision(req);
                                      }}
                                    >
                                      📝 {req.evaluations?.[currentUser.id] ? 'แก้ไขการประเมิน' : 'กรอกการประเมินนิเทศ'}
                                    </button>
                                  )}
                                </>
                              ) : (
                                <span className="badge badge-volunteered" style={{ padding: '0.4rem 0.8rem', display: 'inline-flex', gap: '0.25rem', alignItems: 'center' }}>
                                  <Clock size={12} /> อยู่ระหว่างฝ่ายวิชาการพิจารณาแต่งตั้ง
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Classroom Observation Evaluation Form */}
      {selectedEvalSupervision && (
        <EvaluationModal
          supervision={selectedEvalSupervision}
          currentUser={currentUser}
          onClose={() => setSelectedEvalSupervision(null)}
          onSubmit={async (newEvaluations) => {
            const success = await onUpdateSupervision(selectedEvalSupervision.id, {
              evaluations: newEvaluations
            });
            if (success) {
              alert('บันทึกผลการประเมินนิเทศเรียบร้อยแล้ว!');
              setSelectedEvalSupervision(null);
            } else {
              alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
            }
          }}
        />
      )}

      {/* Modal View Detailed Evaluation Summary Report */}
      {selectedReportSummary && (
        <EvaluationSummaryModal
          supervision={selectedReportSummary}
          onClose={() => setSelectedReportSummary(null)}
        />
      )}
    </div>
  );
}
